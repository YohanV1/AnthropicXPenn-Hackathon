import sqlite3
from typing import List, Tuple


INVOICE_DB_PATH = "invoices.db"


InvoiceRow = Tuple[
    str,  # invoice_number
    str,  # invoice_date (YYYY-MM-DD)
    str,  # due_date (YYYY-MM-DD)
    str,  # seller_information
    str,  # buyer_information
    str,  # purchase_order_number
    str,  # products_services (comma-separated)
    str,  # quantities (comma-separated)
    str,  # unit_prices (comma-separated)
    float,  # subtotal
    float,  # service_charges
    float,  # net_total
    str,  # discount (description or empty)
    float,  # tax
    str,  # tax_rate (percentage as text, e.g. "6")
    float,  # shipping_costs
    float,  # grand_total
    str,  # currency
    str,  # payment_terms
    str,  # payment_method
    str,  # bank_information
    str,  # invoice_notes
    str,  # shipping_address
    str,  # billing_address
]


def _create_schema(cursor: sqlite3.Cursor) -> None:
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_number TEXT NOT NULL UNIQUE,
            invoice_date DATE,
            due_date DATE,
            seller_information TEXT,
            buyer_information TEXT,
            purchase_order_number TEXT,
            products_services TEXT,
            quantities TEXT,
            unit_prices TEXT,
            subtotal NUMERIC,
            service_charges NUMERIC,
            net_total NUMERIC,
            discount TEXT,
            tax NUMERIC,
            tax_rate TEXT,
            shipping_costs NUMERIC,
            grand_total NUMERIC,
            currency TEXT,
            payment_terms TEXT,
            payment_method TEXT,
            bank_information TEXT,
            invoice_notes TEXT,
            shipping_address TEXT,
            billing_address TEXT
        );
        """
    )


def _sample_invoices(buyer_name: str = "Yohan") -> List[InvoiceRow]:
    """Return a set of sample invoices rich enough to support analytics queries."""
    buyer_addr_us = f"{buyer_name}, 123 Personal St, Philadelphia, PA, USA"
    buyer_addr_in = f"{buyer_name}, 45 Residency Rd, Bengaluru, KA, India"

    rows: List[InvoiceRow] = [
        # 2024 technology purchases (laptops, office gear)
        (
            "INV-2024-0001",
            "2024-01-05",
            "2024-02-04",
            "Amazon.com, Seattle, WA, USA",
            buyer_addr_us,
            "PO-TECH-0001",
            "Laptop,USB-C Dock,Wireless Mouse",
            "1,1,2",
            "1500.00,200.00,40.00",
            1780.00,
            0.00,
            1780.00,
            "",
            106.80,
            "6",
            25.00,
            1911.80,
            "USD",
            "Net 30",
            "Credit Card",
            "Bank of Example, Routing 123456789, Account 000123456",
            "Home office setup.",
            buyer_addr_us,
            buyer_addr_us,
        ),
        (
            "INV-2024-0002",
            "2024-01-20",
            "2024-02-19",
            "Apple Store, New York, NY, USA",
            buyer_addr_us,
            "PO-TECH-0002",
            "MacBook Pro,USB-C Hub",
            "1,1",
            "2400.00,80.00",
            2480.00,
            0.00,
            2480.00,
            "",
            148.80,
            "6",
            0.00,
            2628.80,
            "USD",
            "Due on Receipt",
            "Credit Card",
            "Bank of Example, Routing 123456789, Account 000123456",
            "Laptop upgrade.",
            buyer_addr_us,
            buyer_addr_us,
        ),
        # Cloud services & subscriptions
        (
            "INV-2024-0003",
            "2024-02-10",
            "2024-03-11",
            "Amazon Web Services, Inc.",
            buyer_addr_us,
            "PO-CLOUD-0001",
            "AWS EC2,AWS S3",
            "50,5",
            "10.00,5.00",
            525.00,
            0.00,
            525.00,
            "",
            31.50,
            "6",
            0.00,
            556.50,
            "USD",
            "Net 30",
            "Bank transfer",
            "Bank of Example, Routing 123456789, Account 000123456",
            "January AWS usage.",
            buyer_addr_us,
            buyer_addr_us,
        ),
        (
            "INV-2024-0004",
            "2024-03-05",
            "2024-04-04",
            "Google Cloud Platform",
            buyer_addr_us,
            "PO-CLOUD-0002",
            "Google Cloud Compute,Google Cloud Storage",
            "40,4",
            "12.00,4.00",
            496.00,
            0.00,
            496.00,
            "",
            29.76,
            "6",
            0.00,
            525.76,
            "USD",
            "Net 30",
            "Credit Card",
            "Bank of Example, Routing 123456789, Account 000123456",
            "February GCP usage.",
            buyer_addr_us,
            buyer_addr_us,
        ),
        # Food / restaurants
        (
            "INV-2024-0005",
            "2024-03-15",
            "2024-03-15",
            "McDonald's, Philadelphia, PA, USA",
            buyer_addr_us,
            "PO-FOOD-0001",
            "Burger Meal,Fries,Soft Drink",
            "1,1,1",
            "8.00,3.00,2.00",
            13.00,
            0.00,
            13.00,
            "",
            0.78,
            "6",
            0.00,
            13.78,
            "USD",
            "Paid",
            "Credit Card",
            "",
            "Late-night snack.",
            buyer_addr_us,
            buyer_addr_us,
        ),
        (
            "INV-2024-0006",
            "2024-04-02",
            "2024-04-02",
            "Uber Eats",
            buyer_addr_us,
            "PO-FOOD-0002",
            "Pizza,Soda",
            "1,2",
            "20.00,3.00",
            26.00,
            0.00,
            26.00,
            "",
            1.56,
            "6",
            4.99,
            32.55,
            "USD",
            "Paid",
            "Credit Card",
            "",
            "Weekend dinner.",
            buyer_addr_us,
            buyer_addr_us,
        ),
        # Office furniture
        (
            "INV-2024-0007",
            "2024-05-10",
            "2024-06-09",
            "Office Depot",
            buyer_addr_us,
            "PO-OFFICE-0001",
            "Office Chair,Standing Desk",
            "1,1",
            "300.00,600.00",
            900.00,
            0.00,
            900.00,
            "Promo discount 50.00 already applied to subtotal",
            54.00,
            "6",
            40.00,
            994.00,
            "USD",
            "Net 30",
            "Credit Card",
            "",
            "Home office ergonomics.",
            buyer_addr_us,
            buyer_addr_us,
        ),
        # Travel / shipping heavy
        (
            "INV-2024-0008",
            "2024-06-01",
            "2024-07-01",
            "DHL Express",
            buyer_addr_us,
            "PO-SHIP-0001",
            "International shipping",
            "1",
            "120.00",
            120.00,
            0.00,
            120.00,
            "",
            7.20,
            "6",
            25.00,
            152.20,
            "USD",
            "Net 15",
            "Credit Card",
            "",
            "Prototype shipment to EU.",
            buyer_addr_us,
            buyer_addr_us,
        ),
        # Consulting services (net_total comparisons, higher amounts)
        (
            "INV-2024-0009",
            "2024-07-15",
            "2024-08-14",
            "ACME Corp Consulting",
            buyer_addr_us,
            "PO-CONSULT-0001",
            "Consulting,Design Review",
            "20,5",
            "200.00,150.00",
            4750.00,
            250.00,
            5000.00,
            "Loyalty discount 250.00 applied",
            300.00,
            "6",
            0.00,
            5300.00,
            "USD",
            "Net 30",
            "Wire transfer",
            "Bank of Example, Routing 123456789, Account 000123456",
            "Quarterly strategy workshop.",
            buyer_addr_us,
            buyer_addr_us,
        ),
        (
            "INV-2024-0010",
            "2024-08-20",
            "2024-09-19",
            "ACME Corp Consulting",
            buyer_addr_us,
            "PO-CONSULT-0002",
            "Consulting",
            "15",
            "220.00",
            3300.00,
            0.00,
            3300.00,
            "",
            198.00,
            "6",
            0.00,
            3498.00,
            "USD",
            "Net 30",
            "Wire transfer",
            "Bank of Example, Routing 123456789, Account 000123456",
            "Follow-up engagement.",
            buyer_addr_us,
            buyer_addr_us,
        ),
        # Non-USD currency (EUR)
        (
            "INV-2024-0011",
            "2024-09-05",
            "2024-10-05",
            "Spotify AB",
            buyer_addr_us,
            "PO-SUB-0001",
            "Spotify Subscription",
            "1",
            "9.99",
            9.99,
            0.00,
            9.99,
            "",
            2.10,
            "21",
            0.00,
            12.09,
            "EUR",
            "Monthly",
            "Credit Card",
            "",
            "Music subscription.",
            buyer_addr_us,
            buyer_addr_us,
        ),
        # Indian expenses for INR analytics
        (
            "INV-2024-0012",
            "2024-10-10",
            "2024-11-09",
            "Zomato, Bengaluru, KA, India",
            buyer_addr_in,
            "PO-FOOD-IN-0001",
            "Biryani,Soft Drink",
            "2,2",
            "200.00,40.00",
            480.00,
            0.00,
            480.00,
            "",
            86.40,
            "18",
            35.00,
            601.40,
            "INR",
            "Paid",
            "UPI",
            "",
            "Dinner with friends.",
            buyer_addr_in,
            buyer_addr_in,
        ),
        (
            "INV-2024-0013",
            "2024-11-01",
            "2024-12-01",
            "Amazon India",
            buyer_addr_in,
            "PO-TECH-IN-0001",
            "Mechanical Keyboard,USB-C Cable",
            "1,3",
            "4500.00,300.00",
            5400.00,
            0.00,
            5400.00,
            "",
            972.00,
            "18",
            100.00,
            6472.00,
            "INR",
            "Net 30",
            "Credit Card",
            "",
            "Accessories for home office.",
            buyer_addr_in,
            buyer_addr_in,
        ),
        # Some 2023 data for year-over-year comparisons
        (
            "INV-2023-0101",
            "2023-09-15",
            "2023-10-15",
            "Microsoft Corporation",
            buyer_addr_us,
            "PO-SUB-2023-0001",
            "Microsoft 365 Subscription",
            "1",
            "99.00",
            99.00,
            0.00,
            99.00,
            "",
            5.94,
            "6",
            0.00,
            104.94,
            "USD",
            "Annual",
            "Credit Card",
            "",
            "Office suite subscription.",
            buyer_addr_us,
            buyer_addr_us,
        ),
        (
            "INV-2023-0102",
            "2023-11-22",
            "2023-12-22",
            "Nike Store",
            buyer_addr_us,
            "PO-FASHION-2023-0001",
            "Nike shoes,Nike socks",
            "1,3",
            "120.00,10.00",
            150.00,
            0.00,
            150.00,
            "",
            9.00,
            "6",
            0.00,
            159.00,
            "USD",
            "Paid",
            "Credit Card",
            "",
            "Running gear.",
            buyer_addr_us,
            buyer_addr_us,
        ),
    ]

    return rows


def init_invoice_db(db_path: str = INVOICE_DB_PATH) -> None:
    """Create or reset the invoices table and seed it with rich example data."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    _create_schema(cursor)

    # Reset contents so re-running this script keeps data deterministic.
    cursor.execute("DELETE FROM invoices;")

    rows = _sample_invoices()
    cursor.executemany(
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
        rows,
    )

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_invoice_db()
    print(f"Seeded {INVOICE_DB_PATH} with sample invoice data.")


