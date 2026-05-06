#!/usr/bin/env python3
"""
Export orders from api.infinitycolor.co (past 34 hours by default) to Persian PDFs.

Run via: run.bat (Windows) or run.sh (Unix).
Credentials: prompt for API token or phone+password, or set INFINITY_API_TOKEN
or INFINITY_PHONE + INFINITY_PASSWORD. Optional: INFINITY_API_BASE_URL.
"""

import argparse
import getpass
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import requests

# Optional: Persian text support
try:
    import arabic_reshaper
    from bidi.algorithm import get_display
    HAS_BIDI = True
except ImportError:
    HAS_BIDI = False

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle, PageBreak
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False

# --- Persian labels (from frontend ORDER_STATUS_LABELS and gateways) ---
ORDER_STATUS_FA: dict[str, str] = {
    "Paying": "در حال پرداخت",
    "Started": "درحال پردازش",
    "Shipment": "در حال ارسال",
    "Done": "تکمیل شده",
    "Returned": "مرجوع شده",
    "Cancelled": "لغو شده",
}
PAYMENT_GATEWAY_FA: dict[str, str] = {
    "Unknown": "نامشخص",
    "Wallet": "کیف پول",
    "Mellat": "ملت",
    "SnappPay": "اسنپ‌پی",
    "SamanKish": "سامان کیش",
}
CONTRACT_STATUS_FA: dict[str, str] = {
    "Not Ready": "آماده نیست",
    "Confirmed": "تأیید شده",
    "Finished": "پایان یافته",
    "Failed": "ناموفق",
    "Cancelled": "لغو شده",
}

DEFAULT_BASE_URL = "https://api.infinitycolor.co"
API_PATH = "/api"


def _persian(s: str) -> str:
    """Reshape and apply bidi for Persian/RTL display."""
    if not s or not HAS_BIDI:
        return s or ""
    reshaped = arabic_reshaper.reshape(s)
    return get_display(reshaped)


def _escape_para(s: str) -> str:
    """Escape < and > so ReportLab Paragraph does not treat them as tags."""
    if not s:
        return ""
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _fmt_num(n: Any) -> str:
    """Format number for display (e.g. price)."""
    try:
        return f"{int(n):,}".replace(",", "٬")  # Persian thousands
    except (TypeError, ValueError):
        return str(n) if n is not None else ""


def _slug(s: str, max_len: int = 30) -> str:
    """Normalize string to a safe ASCII slug for filenames (e.g. customer name)."""
    if not s or not str(s).strip():
        return "no-name"
    raw = str(s).strip()
    # Replace spaces and invalid path chars with dash; keep only alphanumeric and dash
    out = re.sub(r"[^\w\s-]", "", raw, flags=re.UNICODE)
    out = re.sub(r"[-\s]+", "-", out).strip("-").lower()
    # ASCII-only: replace non-ASCII with empty (Persian names become empty or partial)
    out = "".join(c for c in out if ord(c) < 128)
    out = out.strip("-") or "customer"
    return out[:max_len] if len(out) > max_len else out


def _register_persian_font() -> tuple[str, str]:
    """Register fonts that support Arabic/Persian. Return (regular_name, bold_name)."""
    font_name = "PersianFont"
    font_bold_name = "PersianFontBold"
    if font_name in pdfmetrics.getRegisteredFontNames():
        return (font_name, font_bold_name if font_bold_name in pdfmetrics.getRegisteredFontNames() else font_name)
    if sys.platform == "win32":
        regular_path = os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts", "tahoma.ttf")
        bold_path = os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts", "tahomabd.ttf")
        fallback = os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts", "arial.ttf")
        fallback_bold = os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts", "arialbd.ttf")
        if os.path.isfile(regular_path):
            try:
                pdfmetrics.registerFont(TTFont(font_name, regular_path))
                if os.path.isfile(bold_path):
                    try:
                        pdfmetrics.registerFont(TTFont(font_bold_name, bold_path))
                    except Exception:
                        font_bold_name = font_name
                else:
                    font_bold_name = font_name
                return (font_name, font_bold_name)
            except Exception:
                pass
        if os.path.isfile(fallback):
            try:
                pdfmetrics.registerFont(TTFont(font_name, fallback))
                if os.path.isfile(fallback_bold):
                    try:
                        pdfmetrics.registerFont(TTFont(font_bold_name, fallback_bold))
                    except Exception:
                        font_bold_name = font_name
                else:
                    font_bold_name = font_name
                return (font_name, font_bold_name)
            except Exception:
                pass
    else:
        candidates = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        ]
        for path in candidates:
            if os.path.isfile(path):
                try:
                    pdfmetrics.registerFont(TTFont(font_name, path))
                    return (font_name, font_name)
                except Exception:
                    continue
    return ("Helvetica", "Helvetica-Bold")


def get_token(base_url: str, api_token: Optional[str], phone: Optional[str], password: Optional[str]) -> str:
    """Obtain Bearer token: from API token or via login-with-password."""
    if api_token and api_token.strip():
        return api_token.strip()
    if phone and password:
        url = f"{base_url.rstrip('/')}{API_PATH}/auth/login-with-password"
        try:
            r = requests.post(url, json={"phone": phone.strip(), "password": password}, timeout=30)
            r.raise_for_status()
            data = r.json()
            jwt = data.get("jwt") or (data.get("data") or {}).get("jwt")
            if jwt:
                return jwt
        except requests.RequestException as e:
            print(f"Login error: {e}")
            if hasattr(e, "response") and e.response is not None and e.response.text:
                print(e.response.text[:300])
        except (KeyError, TypeError) as e:
            print(f"Invalid server response: {e}")
    raise SystemExit("Please provide a valid API Token or phone and password. Try again.")


def fetch_orders(base_url: str, token: str, start_iso: str, end_iso: str, hours: int) -> list[dict[str, Any]]:
    """Fetch all orders in date range with full populate (paginated)."""
    base = base_url.rstrip("/")
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    # Populate same as super-admin order detail (nested)
    populate_parts = [
        "populate[user][populate][user_info]=true",
        "populate[contract][populate][contract_transactions][populate][payment_gateway]=true",
        "populate[order_items][populate][product_variation][populate][product][populate][CoverImage]=true",
        "populate[order_items][populate][product_variation][populate][product_variation_color]=true",
        "populate[order_items][populate][product_variation][populate][product_variation_size]=true",
        "populate[order_items][populate][product_variation][populate][product_variation_model]=true",
        "populate[order_items][populate][product_color]=true",
        "populate[order_items][populate][product_size]=true",
        "populate[order_items][populate][product_variation_model]=true",
        "populate[delivery_address][populate][shipping_city][populate][shipping_province]=true",
        "populate[shipping]=true",
    ]
    populate_str = "&".join(populate_parts)
    all_orders: list[dict[str, Any]] = []
    page = 1
    page_size = 100
    # Only paid orders: Status in Started, Shipment, Done (per backend checkPaymentStatus)
    status_filter = "&".join(f"filters[Status][$in][{i}]={s}" for i, s in enumerate(["Started", "Shipment", "Done"]))
    while True:
        url = (
            f"{base}{API_PATH}/orders?"
            f"filters[Date][$gte]={start_iso}&filters[Date][$lte]={end_iso}"
            f"&{status_filter}"
            f"&sort[0]=Date:desc"
            f"&pagination[page]={page}&pagination[pageSize]={page_size}"
            f"&{populate_str}"
        )
        try:
            r = requests.get(url, headers=headers, timeout=60)
            r.raise_for_status()
            body = r.json()
        except requests.RequestException as e:
            print(f"Error fetching orders: {e}")
            if hasattr(e, "response") and e.response is not None:
                print(e.response.text[:500] if e.response.text else "")
            raise SystemExit(1)
        data = body.get("data")
        if not data:
            break
        if isinstance(data, list):
            batch = data
        elif isinstance(data, dict) and "data" in data:
            batch = data["data"] if isinstance(data["data"], list) else [data["data"]]
        else:
            break
        for raw in batch:
            all_orders.append(normalize_order(raw))
        meta = body.get("meta") or {}
        pagination = meta.get("pagination") or {}
        total = pagination.get("total") or 0
        page_count = pagination.get("pageCount") or 1
        if page >= page_count or len(batch) < page_size:
            break
        page += 1
    return all_orders


def _normalize_phone(user: dict[str, Any]) -> str:
    """Extract phone from order user (plugin user has 'phone'; API may return 'Phone' or 'phone'). Always returns a string, never None."""
    if not user:
        return ""
    raw = user.get("phone") or user.get("Phone")
    if raw is None:
        return ""
    s = str(raw).strip()
    return s if s and s != "None" else ""


def _unwrap(obj: Any) -> Any:
    """Unwrap Strapi entity: { id, attributes } -> flat dict with id."""
    if obj is None:
        return None
    if not isinstance(obj, dict):
        return obj
    if "attributes" in obj:
        attrs = obj.get("attributes") or {}
        out = dict(attrs)
        if "id" in obj:
            out["id"] = obj["id"]
        return out
    return obj


def _unwrap_relation(obj: Any) -> Any:
    """Unwrap Strapi relation: { data: single or list } -> single or list of unwrapped."""
    if obj is None:
        return None
    if isinstance(obj, dict) and "data" in obj:
        d = obj["data"]
        if d is None:
            return None
        if isinstance(d, list):
            return [_unwrap(x) for x in d]
        return _unwrap(d)
    return _unwrap(obj)


def normalize_order(raw: dict[str, Any]) -> dict[str, Any]:
    """Normalize Strapi order to flat structure for PDF."""
    o = _unwrap(raw)
    if not o:
        return {}
    user = _unwrap_relation(o.get("user"))
    user_info = _unwrap_relation(user.get("user_info")) if user else None
    contract = _unwrap_relation(o.get("contract"))
    items_raw = _unwrap_relation(o.get("order_items"))
    items: list[dict[str, Any]] = []
    if items_raw:
        for it in items_raw if isinstance(items_raw, list) else [items_raw]:
            it = _unwrap(it)
            if not it:
                continue
            pv = _unwrap_relation(it.get("product_variation"))
            product = _unwrap_relation(pv.get("product")) if pv else None
            color = _unwrap_relation(it.get("product_color"))
            size = _unwrap_relation(it.get("product_size"))
            model = _unwrap_relation(it.get("product_variation_model"))
            pv_color = _unwrap_relation(pv.get("product_variation_color")) if pv else None
            pv_size = _unwrap_relation(pv.get("product_variation_size")) if pv else None
            pv_model = _unwrap_relation(pv.get("product_variation_model")) if pv else None
            items.append({
                "title": it.get("ProductTitle") or (product.get("Title") if product else ""),
                "sku": it.get("ProductSKU") or (pv.get("SKU") if pv else ""),
                "count": int(it.get("Count") or 0),
                "per_amount": int(it.get("PerAmount") or 0),
                "color": (color.get("Title") if color else None) or (pv_color.get("Title") if pv_color else None),
                "size": (size.get("Title") if size else None) or (pv_size.get("Title") if pv_size else None),
                "model": (model.get("Title") if model else None) or (pv_model.get("Title") if pv_model else None),
            })
    addr = _unwrap_relation(o.get("delivery_address"))
    city = _unwrap_relation(addr.get("shipping_city")) if addr else None
    province = _unwrap_relation(city.get("shipping_province")) if city else _unwrap_relation(addr.get("shipping_province")) if addr else None
    shipping = _unwrap_relation(o.get("shipping"))
    return {
        "id": o.get("id"),
        "date": o.get("Date"),
        "status": o.get("Status"),
        "description": o.get("Description") or "",
        "note": o.get("Note") or "",
        "user_phone": _normalize_phone(user) if user else "",
        "first_name": (user_info.get("FirstName") if user_info else "") or "",
        "last_name": (user_info.get("LastName") if user_info else "") or "",
        "full_address": addr.get("FullAddress") if addr else "",
        "postal_code": addr.get("PostalCode") if addr else "",
        "city": city.get("Title") if city else "",
        "province": province.get("Title") if province else "",
        "shipping_title": shipping.get("Title") if shipping else "",
        "shipping_cost": int(o.get("ShippingCost") or 0),
        "discount_code": o.get("DiscountCode") or "",
        "applied_discount": int(o.get("AppliedDiscountAmount") or 0),
        "payment_gateway": o.get("PaymentGateway") or "Unknown",
        "contract_amount": int(contract.get("Amount") or 0) if contract else 0,
        "contract_status": contract.get("Status") if contract else "",
        "order_items": items,
    }


def _hex(s: str):
    """Return a ReportLab HexColor for a hex string."""
    return colors.HexColor(s)


def build_pdf(orders: list[dict[str, Any]], output_path: str, font_name: str, font_bold_name: str) -> None:
    """Build one PDF with one section per order (Persian labels, RTL-friendly)."""
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=18 * mm,
        bottomMargin=20 * mm,
    )
    story: list[Any] = []
    styles = getSampleStyleSheet()
    # Bold styles for headings and labels
    banner_style = ParagraphStyle(
        name="PersianBanner",
        parent=styles["Normal"],
        fontName=font_bold_name,
        fontSize=18,
        alignment=2,
        textColor=colors.white,
        leftIndent=0,
        rightIndent=0,
        spaceBefore=0,
        spaceAfter=0,
    )
    section_style = ParagraphStyle(
        name="PersianSection",
        parent=styles["Normal"],
        fontName=font_bold_name,
        fontSize=12,
        alignment=2,
        spaceBefore=6 * mm,
        spaceAfter=2 * mm,
    )
    cell_style = ParagraphStyle(
        name="PersianCell",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=10,
        alignment=2,
        leading=11,
        leftIndent=0,
        rightIndent=0,
        spaceBefore=0,
        spaceAfter=0,
    )
    cell_style_bold = ParagraphStyle(
        name="PersianCellBold",
        parent=cell_style,
        fontName=font_bold_name,
    )
    items_cell_style = ParagraphStyle(
        name="PersianItemsCell",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=9,
        alignment=2,
        leading=10,
        leftIndent=0,
        rightIndent=0,
        spaceBefore=0,
        spaceAfter=0,
    )
    items_header_style = ParagraphStyle(
        name="PersianItemsHeader",
        parent=items_cell_style,
        fontName=font_bold_name,
        textColor=colors.white,
    )
    totals_cell_style = ParagraphStyle(
        name="PersianTotalsCell",
        parent=cell_style,
        fontSize=10,
    )
    totals_cell_bold_style = ParagraphStyle(
        name="PersianTotalsCellBold",
        parent=cell_style,
        fontName=font_bold_name,
        fontSize=10,
    )

    def _cell(s: str, bold: bool = False):
        style = cell_style_bold if bold else cell_style
        return Paragraph(_escape_para(_persian(s)), style)

    def _display_phone(phone: Any) -> str:
        """Display phone for PDF; user always has a phone per schema, but guard against bad data."""
        if phone is None or (isinstance(phone, str) and (not phone.strip() or phone.strip() == "None")):
            return "—"
        return str(phone).strip()

    def _display_discount(order: dict[str, Any]) -> str:
        code = (order.get("discount_code") or "").strip()
        amount = int(order.get("applied_discount") or 0)
        if not code and amount == 0:
            return "—"
        if not code:
            return f"{_fmt_num(amount)} تومان"
        return f"{code} / {_fmt_num(amount)} تومان"

    content_width = 165 * mm  # A4 minus side margins approx
    generation_ts: list[str] = []

    def _add_footer(canvas: Any, doc: Any) -> None:
        ts = generation_ts[0] if generation_ts else datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
        page_w = doc.pagesize[0]
        left = 20 * mm
        right = page_w - 20 * mm
        y = 12 * mm
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#6b7280"))
        canvas.drawString(left, y, f"Generated: {ts}")
        canvas.drawRightString(right, y, "Infinitycolor.co")
        canvas.setStrokeColor(colors.HexColor("#e5e7eb"))
        canvas.setLineWidth(0.5)
        canvas.line(left, 14 * mm, right, 14 * mm)
        canvas.restoreState()

    for i, order in enumerate(orders):
        if i > 0:
            story.append(PageBreak())
        if not generation_ts:
            generation_ts.append(datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"))

        order_id = order.get("id") or i + 1
        date_str = order.get("date") or ""
        if isinstance(date_str, str) and "T" in date_str:
            date_str = date_str.replace("T", " ").split(".")[0][:19]

        # Header banner: dark background, white bold text
        banner_cell = Paragraph(_escape_para(_persian(f"سفارش #{order_id}  ·  {date_str}")), banner_style)
        banner_table = Table([[banner_cell]], colWidths=[content_width])
        banner_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), _hex("#1f2937")),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(banner_table)
        # Accent line below banner
        accent_table = Table([[""]], colWidths=[content_width])
        accent_table.setStyle(TableStyle([
            ("LINEABOVE", (0, 0), (-1, 0), 2, _hex("#3b82f6")),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        story.append(accent_table)
        story.append(Spacer(1, 6 * mm))

        # Section: Order details (bold labels, gray label column, row borders; no shipping/final amount here)
        story.append(Paragraph(_escape_para(_persian("اطلاعات سفارش")), section_style))
        status_fa = ORDER_STATUS_FA.get(order.get("status") or "", order.get("status") or "")
        gateway_fa = PAYMENT_GATEWAY_FA.get(order.get("payment_gateway") or "Unknown", order.get("payment_gateway") or "")
        contract_status_fa = CONTRACT_STATUS_FA.get(order.get("contract_status") or "", order.get("contract_status") or "")
        customer_name = f"{order.get('first_name', '')} {order.get('last_name', '')}".strip()
        city_province_postal = f"{order.get('city', '')}، {order.get('province', '')}، {order.get('postal_code', '')}".strip()
        # RTL: value in col 0 (drawn left), label in col 1 (drawn right) so labels appear on the right
        detail_rows = [
            [_cell(date_str), _cell("تاریخ", True)],
            [_cell(status_fa), _cell("وضعیت", True)],
            [_cell(customer_name or "—"), _cell("مشتری", True)],
            [_cell(_display_phone(order.get("user_phone"))), _cell("تلفن", True)],
            [_cell(order.get("full_address") or "—"), _cell("آدرس", True)],
            [_cell(city_province_postal or "—"), _cell("شهر / استان / کد پستی", True)],
            [_cell(order.get("shipping_title") or "—"), _cell("روش ارسال", True)],
            [_cell(_display_discount(order)), _cell("کد تخفیف / مبلغ تخفیف", True)],
            [_cell(gateway_fa), _cell("درگاه پرداخت", True)],
            [_cell(contract_status_fa), _cell("وضعیت قرارداد", True)],
        ]
        if order.get("note"):
            detail_rows.append([_cell(order["note"]), _cell("یادداشت", True)])
        if order.get("description"):
            detail_rows.append([_cell(order["description"]), _cell("توضیحات", True)])
        detail_table = Table(detail_rows, colWidths=[115 * mm, 50 * mm])
        detail_style_list: list[tuple] = [
            ("FONTNAME", (0, 0), (0, -1), font_name),
            ("FONTNAME", (1, 0), (1, -1), font_bold_name),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BACKGROUND", (0, 0), (0, -1), colors.white),
            ("BACKGROUND", (1, 0), (1, -1), _hex("#f3f4f6")),
        ]
        for r in range(len(detail_rows)):
            detail_style_list.append(("LINEBELOW", (0, r), (-1, r), 0.5, _hex("#e5e7eb")))
        detail_table.setStyle(TableStyle(detail_style_list))
        story.append(detail_table)
        story.append(Spacer(1, 6 * mm))

        # Section: Order items. RTL column order (rightmost first): ردیف, نام محصول, رنگ, سایز/مدل, تعداد, مبلغ واحد, جمع. No کد.
        story.append(Paragraph(_escape_para(_persian("آیتم‌های سفارش")), section_style))
        # RTL: build columns so that ردیف is rightmost -> put ردیف last in row list (col index 6)
        item_headers = [
            Paragraph(_escape_para(_persian("جمع")), items_header_style),
            Paragraph(_escape_para(_persian("مبلغ واحد")), items_header_style),
            Paragraph(_escape_para(_persian("تعداد")), items_header_style),
            Paragraph(_escape_para(_persian("سایز / مدل")), items_header_style),
            Paragraph(_escape_para(_persian("رنگ")), items_header_style),
            Paragraph(_escape_para(_persian("نام محصول")), items_header_style),
            Paragraph(_escape_para(_persian("ردیف")), items_header_style),
        ]
        rows: list[list[Any]] = [item_headers]
        for j, it in enumerate(order.get("order_items") or [], 1):
            q = it.get("count") or 0
            p = it.get("per_amount") or 0
            size_val = (it.get("size") or "").strip()
            model_val = (it.get("model") or "").strip()
            spec = " / ".join(x for x in [size_val, model_val] if x) or "—"
            rows.append([
                Paragraph(_escape_para(_fmt_num(q * p)), items_cell_style),
                Paragraph(_escape_para(_fmt_num(p)), items_cell_style),
                Paragraph(_escape_para(str(q)), items_cell_style),
                Paragraph(_escape_para(_persian(spec)), items_cell_style),
                Paragraph(_escape_para(_persian(it.get("color") or "")), items_cell_style),
                Paragraph(_escape_para(_persian(it.get("title") or "")), items_cell_style),
                Paragraph(_escape_para(str(j)), items_cell_style),
            ])
        if len(rows) > 1:
            t = Table(rows, colWidths=[22 * mm, 22 * mm, 14 * mm, 22 * mm, 20 * mm, 48 * mm, 12 * mm])
            style_list: list[tuple] = [
                ("FONTNAME", (0, 0), (-1, -1), font_name),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BACKGROUND", (0, 0), (-1, 0), _hex("#374151")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("GRID", (0, 0), (-1, -1), 0.5, _hex("#e5e7eb")),
            ]
            for r in range(1, len(rows)):
                if r % 2 == 0:
                    style_list.append(("BACKGROUND", (0, r), (-1, r), _hex("#f9fafb")))
            t.setStyle(TableStyle(style_list))
            story.append(t)
        story.append(Spacer(1, 4 * mm))

        # Totals summary. RTL: value in col 0 (left), label in col 1 (right) so labels on the right
        subtotal = sum((it.get("count") or 0) * (it.get("per_amount") or 0) for it in (order.get("order_items") or []))
        shipping_cost = int(order.get("shipping_cost") or 0)
        applied_discount = int(order.get("applied_discount") or 0)
        final_amount = int(order.get("contract_amount") or 0)
        totals_rows = [
            [Paragraph(_escape_para(_persian(f"{_fmt_num(subtotal)} تومان")), totals_cell_style), Paragraph(_escape_para(_persian("جمع کالاها")), totals_cell_style)],
            [Paragraph(_escape_para(_persian(f"{_fmt_num(shipping_cost)} تومان")), totals_cell_style), Paragraph(_escape_para(_persian("هزینه ارسال")), totals_cell_style)],
            [Paragraph(_escape_para(_persian(f"{_fmt_num(applied_discount)} تومان")), totals_cell_style), Paragraph(_escape_para(_persian("تخفیف")), totals_cell_style)],
            [Paragraph(_escape_para(_persian(f"{_fmt_num(final_amount)} تومان")), totals_cell_bold_style), Paragraph(_escape_para(_persian("مبلغ نهایی")), totals_cell_bold_style)],
        ]
        totals_table = Table(totals_rows, colWidths=[40 * mm, 40 * mm])
        totals_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, -1), font_name),
            ("FONTNAME", (0, 3), (-1, 3), font_bold_name),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LINEABOVE", (0, 3), (-1, 3), 1, _hex("#374151")),
            ("TOPPADDING", (0, 3), (-1, 3), 6),
        ]))
        story.append(totals_table)
        story.append(Spacer(1, 4 * mm))

    doc.build(story, onFirstPage=_add_footer, onLaterPages=_add_footer)


def main() -> None:
    parser = argparse.ArgumentParser(description="Export orders from api.infinitycolor.co to Persian PDFs (default: last 34 hours).")
    parser.add_argument("--hours", type=int, default=34, help="Number of past hours (default: 34)")
    parser.add_argument("--output", default="orders", help="Output directory for PDFs (default: orders)")
    parser.add_argument("--base-url", default=os.environ.get("INFINITY_API_BASE_URL", DEFAULT_BASE_URL), help="API base URL")
    args = parser.parse_args()
    base_url = (args.base_url or DEFAULT_BASE_URL).rstrip("/")
    if not HAS_REPORTLAB:
        print("Error: reportlab is not installed. Run via run.bat or run.sh.")
        sys.exit(1)
    if not HAS_BIDI:
        print("Warning: arabic-reshaper or python-bidi is not installed; Persian text may not display correctly.")
    end_dt = datetime.now(timezone.utc)
    start_dt = end_dt - timedelta(hours=args.hours)
    start_iso = start_dt.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    end_iso = end_dt.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    api_token = os.environ.get("INFINITY_API_TOKEN", "").strip()
    phone = os.environ.get("INFINITY_PHONE", "").strip()
    password = os.environ.get("INFINITY_PASSWORD", "")
    if not api_token and (not phone or not password):
        print("Log in to api.infinitycolor.co")
        if not api_token:
            api_token = input("API Token (leave empty to use phone + password): ").strip()
        if not api_token and not phone:
            phone = input("Phone: ").strip()
        if not api_token and not password:
            password = getpass.getpass("Password: ")
    token = get_token(base_url, api_token or None, phone or None, password or None)
    print("Fetching orders...")
    orders = fetch_orders(base_url, token, start_iso, end_iso, args.hours)
    print(f"Fetched {len(orders)} orders.")
    if not orders:
        print("No orders found in this range.")
        sys.exit(0)
    font_name, font_bold_name = _register_persian_font()
    output_dir = args.output.rstrip("/").rstrip("\\")
    if not output_dir:
        output_dir = "orders"
    os.makedirs(output_dir, exist_ok=True)
    written: list[str] = []
    for order in orders:
        order_id = order.get("id") or 0
        date_val = order.get("date") or ""
        if isinstance(date_val, str) and "T" in date_val:
            date_str = date_val.split("T")[0]
        else:
            date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        first = (order.get("first_name") or "").strip()
        last = (order.get("last_name") or "").strip()
        customer_slug = _slug(f"{first} {last}".strip())
        filename = f"order-{order_id}-{date_str}-{customer_slug}.pdf"
        path = os.path.join(output_dir, filename)
        build_pdf([order], path, font_name, font_bold_name)
        written.append(filename)
    print(f"Wrote {len(written)} PDFs to {os.path.abspath(output_dir)}")
    for f in written:
        print(f"  {f}")


if __name__ == "__main__":
    main()
