"""
Utilities for performing OCR on invoice files and inserting structured data
into the local SQLite `invoices` table used by FiscalFlow.

This is a modernised version of an older S3/Streamlit-based script. It no longer
depends on boto3, Streamlit, or an external database helper module.
"""

import base64
import os
from io import BytesIO
from typing import Any, Dict

import requests
import sqlite3
from dotenv import load_dotenv
from pdf2image import convert_from_bytes

from seed_invoices import INVOICE_DB_PATH


load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_URL = "https://api.openai.com/v1/chat/completions"


def _file_bytes_to_base64_image(file_bytes: bytes, filename: str) -> str:
    """Convert PDF/image bytes to a base64-encoded PNG/JPEG string."""
    lower = filename.lower()
    if lower.endswith(".pdf"):
        images = convert_from_bytes(file_bytes, dpi=300)
        img_byte_arr = BytesIO()
        images[0].save(img_byte_arr, format="PNG")
        img_bytes = img_byte_arr.getvalue()
    else:
        img_bytes = file_bytes

    return base64.b64encode(img_bytes).decode("utf-8")


_PROMPT = """Perform OCR on the given image and extract the following key invoice attributes.
Format your response as `[serial no.]. [key]: [value]`. If an attribute is not present, use `NULL`.
Convert any percentages to numeric (Example: 20% = 0.2). Provide prices only as numerics, without currency.
Do not provide any additional text or explanations.

1. invoice_number: The unique identifier for this invoice. (TEXT)
2. invoice_date: The date the invoice was issued (format: YYYY-MM-DD). (DATE)
3. due_date: The date by which payment is expected (format: YYYY-MM-DD). (DATE)
4. seller_information: Full name, address, and contact details of the seller. (TEXT)
5. buyer_information: Full name, address, and contact details of the buyer. (TEXT)
6. purchase_order_number: The buyer's purchase order number, if available. (TEXT)
7. products_services: Comma-separated list of all items or services billed. Do not include services like shipping. (TEXT)
8. quantities: Comma-separated list of quantities for each item, in the same order as the products/services. Do not include commas in each quantity itself. (INTEGER)
9. unit_prices: Comma-separated list of unit prices for each item, in the same order as the products/services. Do not include commas in each unit price itself. (NUMERIC)
10. subtotal: The sum of all line items before taxes and discounts. Do not include any commas in the subtotal. (NUMERIC)
11. service_charges: Any additional charges that may be applied. Do not include shipping costs here. Do not include any commas in the service charge. (NUMERIC)
12. net_total: Sum of subtotal and service charges. Do not include any commas in the net total. (NUMERIC)
13. discount: Any discounts applied to the invoice. Do not include any commas in the discount. (TEXT)
14. tax: The total amount of tax charged. Do not include any commas in the tax. (NUMERIC)
15. tax_rate: The percentage rate at which tax is charged. Do not include any commas in the tax rate. (TEXT)
16. shipping_costs: Any shipping or delivery charges. Do not include any commas in the shipping costs. (NUMERIC)
17. grand_total: The final amount to be paid, including all taxes and fees. Do not include any commas in the grand total. (NUMERIC)
18. currency: The currency in which the invoice is issued (INR, USD, SGD, AUD, etc). (TEXT)
19. payment_terms: The terms of payment (e.g., "Net 30", "Due on Receipt"). (TEXT)
20. payment_method: Accepted or preferred payment methods. (TEXT)
21. bank_information: Seller's bank details for payment, if provided. (TEXT)
22. invoice_notes: Any additional notes or terms on the invoice. (TEXT)
23. shipping_address: The delivery address. (TEXT)
24. billing_address: The billing address. (TEXT)
"""


def extract_invoice_fields(file_bytes: bytes, filename: str) -> Dict[str, str]:
    """Call OpenAI vision to extract structured invoice fields from a file."""
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not set")

    base64_image = _file_bytes_to_base64_image(file_bytes, filename)

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}",
    }

    payload: Dict[str, Any] = {
        "model": "gpt-4o",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": _PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}",
                        },
                    },
                ],
            }
        ],
    }

    response = requests.post(OPENAI_URL, headers=headers, json=payload, timeout=90)
    response.raise_for_status()
    data = response.json()
    content = data["choices"][0]["message"]["content"]

    invoice: Dict[str, str] = {}
    for raw_line in content.splitlines():
        line = raw_line.strip()
        if ": " not in line:
            continue
        # Strip leading serial number, e.g. "1. invoice_number: 123"
        try:
            substring = line[line.find(" ") + 1 :]
            key, value = substring.split(": ", 1)
        except ValueError:
            continue
        invoice[key.strip()] = value.strip()

    return invoice


def insert_invoice_into_db(invoice: Dict[str, str]) -> None:
    """Insert a single invoice row into the local SQLite invoices table."""
    conn = sqlite3.connect(INVOICE_DB_PATH)
    cursor = conn.cursor()

    def _num(name: str) -> float:
        val = (invoice.get(name) or "").strip()
        if not val or val.upper() == "NULL":
            return 0.0
        try:
            return float(val)
        except ValueError:
            return 0.0

    cursor.execute(
        """
        INSERT INTO invoices (
            invoice_number,
            invoice_date,
            due_date,
            seller_information,
            buyer_information,
            purchase_order_number,
            products_services,
            quantities,
            unit_prices,
            subtotal,
            service_charges,
            net_total,
            discount,
            tax,
            tax_rate,
            shipping_costs,
            grand_total,
            currency,
            payment_terms,
            payment_method,
            bank_information,
            invoice_notes,
            shipping_address,
            billing_address
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        );
        """,
        (
            invoice.get("invoice_number"),
            invoice.get("invoice_date"),
            invoice.get("due_date"),
            invoice.get("seller_information"),
            invoice.get("buyer_information"),
            invoice.get("purchase_order_number"),
            invoice.get("products_services"),
            invoice.get("quantities"),
            invoice.get("unit_prices"),
            _num("subtotal"),
            _num("service_charges"),
            _num("net_total"),
            invoice.get("discount"),
            _num("tax"),
            invoice.get("tax_rate"),
            _num("shipping_costs"),
            _num("grand_total"),
            invoice.get("currency"),
            invoice.get("payment_terms"),
            invoice.get("payment_method"),
            invoice.get("bank_information"),
            invoice.get("invoice_notes"),
            invoice.get("shipping_address"),
            invoice.get("billing_address"),
        ),
    )

    conn.commit()
    conn.close()


def process_invoice_file(file_bytes: bytes, filename: str) -> Dict[str, str]:
    """
    High-level helper:
    - Run OCR & field extraction on the given file bytes.
    - Insert the invoice into the local SQLite DB.
    - Return the extracted invoice dictionary.
    """
    invoice = extract_invoice_fields(file_bytes, filename)
    insert_invoice_into_db(invoice)
    return invoice
