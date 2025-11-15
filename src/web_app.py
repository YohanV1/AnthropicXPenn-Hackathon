import os
from pathlib import Path
from typing import Literal

import sqlite3
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.responses import HTMLResponse, JSONResponse
from langchain.chat_models import init_chat_model
from langchain.messages import AIMessage
from langchain_community.agent_toolkits import SQLDatabaseToolkit
from langchain_community.utilities import SQLDatabase
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode
from pydantic import BaseModel

from seed_invoices import INVOICE_DB_PATH
from ocr import process_invoice_file


load_dotenv()
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")


llm = init_chat_model("gpt-4.1-mini")
db = SQLDatabase.from_uri(f"sqlite:///{INVOICE_DB_PATH}")

toolkit = SQLDatabaseToolkit(db=db, llm=llm)
tools = toolkit.get_tools()

get_schema_tool = next(tool for tool in tools if tool.name == "sql_db_schema")
get_schema_node = ToolNode([get_schema_tool], name="get_schema")

run_query_tool = next(tool for tool in tools if tool.name == "sql_db_query")
run_query_node = ToolNode([run_query_tool], name="run_query")


def list_tables(state: MessagesState):
    tool_call = {
        "name": "sql_db_list_tables",
        "args": {},
        "id": "abc123",
        "type": "tool_call",
    }
    tool_call_message = AIMessage(content="", tool_calls=[tool_call])

    list_tables_tool = next(tool for tool in tools if tool.name == "sql_db_list_tables")
    tool_message = list_tables_tool.invoke(tool_call)
    response = AIMessage(f"Available tables: {tool_message.content}")

    return {"messages": [tool_call_message, tool_message, response]}


def call_get_schema(state: MessagesState):
    llm_with_tools = llm.bind_tools([get_schema_tool], tool_choice="any")
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}


generate_query_system_prompt = """
You are an agent designed to interact with a SQL database of personal invoices.
Given an input question, create a syntactically correct {dialect} query to run,
then look at the results of the query and return the answer in clear,
user-friendly language. Unless the user specifies a specific number of examples
they wish to obtain, always limit your query to at most {top_k} results.

You can order the results by a relevant column to return the most interesting
examples in the database. Never query for all the columns from a specific table,
only ask for the relevant columns given the question.

DO NOT make any DML statements (INSERT, UPDATE, DELETE, DROP etc.) to the database.
""".format(
    dialect=db.dialect,
    top_k=5,
)


def generate_query(state: MessagesState):
    system_message = {
        "role": "system",
        "content": generate_query_system_prompt,
    }
    llm_with_tools = llm.bind_tools([run_query_tool])
    response = llm_with_tools.invoke([system_message] + state["messages"])
    return {"messages": [response]}


check_query_system_prompt = """
You are a SQL expert with a strong attention to detail.
Double check the {dialect} query for common mistakes, including:
- Using NOT IN with NULL values
- Using UNION when UNION ALL should have been used
- Using BETWEEN for exclusive ranges
- Data type mismatch in predicates
- Properly quoting identifiers
- Using the correct number of arguments for functions
- Casting to the correct data type
- Using the proper columns for joins

If there are any of the above mistakes, rewrite the query. If there are no mistakes,
just reproduce the original query.

You will call the appropriate tool to execute the query after running this check.
""".format(
    dialect=db.dialect
)


def check_query(state: MessagesState):
    system_message = {
        "role": "system",
        "content": check_query_system_prompt,
    }

    tool_call = state["messages"][-1].tool_calls[0]
    user_message = {"role": "user", "content": tool_call["args"]["query"]}
    llm_with_tools = llm.bind_tools([run_query_tool], tool_choice="any")
    response = llm_with_tools.invoke([system_message, user_message])
    response.id = state["messages"][-1].id

    return {"messages": [response]}


def should_continue(state: MessagesState) -> Literal[END, "check_query"]:
    messages = state["messages"]
    last_message = messages[-1]
    if not last_message.tool_calls:
        return END
    else:
        return "check_query"


builder = StateGraph(MessagesState)
builder.add_node(list_tables)
builder.add_node(call_get_schema)
builder.add_node(get_schema_node, "get_schema")
builder.add_node(generate_query)
builder.add_node(check_query)
builder.add_node(run_query_node, "run_query")

builder.add_edge(START, "list_tables")
builder.add_edge("list_tables", "call_get_schema")
builder.add_edge("call_get_schema", "get_schema")
builder.add_edge("get_schema", "generate_query")
builder.add_conditional_edges(
    "generate_query",
    should_continue,
)
builder.add_edge("check_query", "run_query")
builder.add_edge("run_query", "generate_query")

agent = builder.compile()


class QueryRequest(BaseModel):
    question: str


app = FastAPI()

TEMPLATE_PATH = Path(__file__).parent / "templates" / "index.html"


@app.get("/", response_class=HTMLResponse)
async def index() -> HTMLResponse:
    """Serve a minimal Tailwind-based UI for querying the invoice agent."""
    try:
        html = TEMPLATE_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="index.html template not found")
    return HTMLResponse(content=html)


@app.post("/api/query")
async def query(req: QueryRequest) -> JSONResponse:
    """Run a natural-language question through the invoice agent."""
    try:
        state = agent.invoke({"messages": [{"role": "user", "content": req.question}]})
        messages = state["messages"]
        last = messages[-1]
        content = getattr(last, "content", "")
        if not isinstance(content, str):
            content = str(content)
        return JSONResponse({"answer": content})
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/metrics")
async def metrics() -> JSONResponse:
    """Return simple numeric KPIs for the dashboard."""
    try:
        conn = sqlite3.connect(INVOICE_DB_PATH)
        cursor = conn.cursor()

        # Year-to-date spend (for 2024 in this seeded example).
        cursor.execute(
            """
            SELECT IFNULL(SUM(grand_total), 0)
            FROM invoices
            WHERE invoice_date >= '2024-01-01' AND invoice_date <= '2024-12-31';
            """
        )
        (ytd_spend,) = cursor.fetchone()

        # Top vendor by total spend.
        cursor.execute(
            """
            SELECT seller_information, SUM(grand_total) AS total
            FROM invoices
            GROUP BY seller_information
            ORDER BY total DESC
            LIMIT 1;
            """
        )
        row = cursor.fetchone()
        top_vendor = row[0] if row else None

        # Last food invoice (very simple heuristic on product names).
        cursor.execute(
            """
            SELECT invoice_date, seller_information
            FROM invoices
            WHERE LOWER(products_services) LIKE '%pizza%'
               OR LOWER(products_services) LIKE '%burger%'
               OR LOWER(products_services) LIKE '%biryani%'
               OR LOWER(products_services) LIKE '%food%'
            ORDER BY invoice_date DESC
            LIMIT 1;
            """
        )
        row = cursor.fetchone()
        last_food = None
        if row:
            last_food = {"date": row[0], "seller": row[1]}

        # Currency mix.
        cursor.execute(
            """
            SELECT currency, SUM(grand_total) AS total
            FROM invoices
            GROUP BY currency
            ORDER BY total DESC;
            """
        )
        currencies = cursor.fetchall()
        currency_summary = ", ".join(
            f"{code}: {round(total, 2)}" for code, total in currencies
        )

        conn.close()

        return JSONResponse(
            {
                "ytd_spend": round(float(ytd_spend or 0), 2),
                "top_vendor": top_vendor,
                "last_food": last_food,
                "currency_mix": currency_summary,
            }
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/upload")
async def upload_invoices(files: list[UploadFile] = File(...)) -> JSONResponse:
    """Accept one or more invoice files, run OCR, and insert into the DB."""
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    results = []
    for f in files:
        content = await f.read()
        invoice = process_invoice_file(content, f.filename)
        results.append(
            {
                "filename": f.filename,
                "invoice_number": invoice.get("invoice_number"),
                "invoice_date": invoice.get("invoice_date"),
                "seller_information": invoice.get("seller_information"),
                "grand_total": invoice.get("grand_total"),
                "currency": invoice.get("currency"),
            }
        )

    return JSONResponse({"invoices": results})



