import React from "react";

interface AnipoBarcodeProps {
  packageNumber?: string;
  packageSize?: string;
  origin?: string;
  destination?: string;
  weight?: string;
  time?: string;
  date?: string;
  fare?: string;
  barcodeNumber?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientAddress?: string;
}

const AnipoBarcodeLabel = (props: AnipoBarcodeProps) => {
  const {
    packageNumber = "۱",
    packageSize = "سایز بسته ۱",
    origin = "میدا",
    destination = "گرگان",
    weight = "۱۰۰ گرم",
    time = "۱۰:۱۰",
    date = "۱۴۰۲/۰۷/۳۰",
    fare = "۲۵۸۵۰۰ ریال",
    barcodeNumber = "۷۹۹۰۵۰۳۲۱۶۰۰۳۸۶۳۱۰۰۶۹۱۶۷",
    recipientName = "",
    recipientPhone = "",
    recipientAddress = "",
  } = props;

  return (
    <div className="anipo-label">
      {/* Header Section */}
      <div className="anipo-header">
        <div className="anipo-package-info">
          <div className="anipo-package-title">بسته</div>
          <div className="anipo-package-size">{packageSize}</div>
          <div className="anipo-service">آنیپو</div>
          <div className="anipo-package-number">{packageNumber.slice(-2) || "16"}</div>
        </div>

        <div className="anipo-company-info">
          <div className="anipo-logo">
            <svg viewBox="0 0 48 48" className="anipo-logo-svg">
              <path
                d="M24 4L36 16L24 28L12 16Z"
                fill="none"
                stroke="black"
                strokeWidth="2"
              />
              <path
                d="M12 20L24 32L36 20"
                fill="none"
                stroke="black"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="anipo-company-name">شرکت ملی پست</div>
          <div className="anipo-service-type">پیشتاز</div>
          <div className="anipo-branch">باجه مجازی آنیپو</div>
        </div>

        <div className="anipo-qr-code">
          <div className="anipo-qr-pattern"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="anipo-content">
        {/* Origin and Destination Row */}
        <div className="anipo-row anipo-origin-dest">
          <div className="anipo-number-box">
            {packageNumber.slice(-2) || "24"}
          </div>
          <div className="anipo-dual-field">
            <div className="anipo-field anipo-bordered-left">
              {origin}
            </div>
            <div className="anipo-field">
              {destination}
            </div>
          </div>
        </div>

        {/* Weight and Destination Detail Row */}
        <div className="anipo-row anipo-weight-dest">
          <div className="anipo-field">
            مقصد {destination}
          </div>
          <div className="anipo-field anipo-no-right-border">
            وزن {weight}
          </div>
        </div>

        {/* Time and Date Row */}
        <div className="anipo-row anipo-time-date">
          <div className="anipo-field">
            زمان {time}
          </div>
          <div className="anipo-field anipo-no-right-border">
            تاریخ {date}
          </div>
        </div>

        {/* Fare Row */}
        <div className="anipo-row anipo-fare">
          <div className="anipo-field anipo-full-width">
            کرایه {fare}
          </div>
        </div>
      </div>

      {/* Barcode Section */}
      <div className="anipo-barcode-section">
        <div className="anipo-barcode-lines">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="anipo-barcode-line"
              style={{
                height: `${Math.random() * 40 + 20}px`,
              }}
            />
          ))}
        </div>
        <div className="anipo-barcode-number">{barcodeNumber}</div>
      </div>

      {/* Recipient Info (for reference, not visible in print) */}
      {(recipientName || recipientPhone || recipientAddress) && (
        <div className="anipo-recipient-info print:hidden">
          {recipientName && <div><strong>گیرنده:</strong> {recipientName}</div>}
          {recipientPhone && <div><strong>تلفن:</strong> {recipientPhone}</div>}
          {recipientAddress && <div><strong>آدرس:</strong> {recipientAddress}</div>}
        </div>
      )}
    </div>
  );
};

export default AnipoBarcodeLabel;