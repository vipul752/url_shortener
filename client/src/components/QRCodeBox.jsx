import { QRCodeCanvas } from "qrcode.react";

export default function QRCodeBox({ url }) {
  return (
    <div className="mt-4">
      <QRCodeCanvas value={url} size={200} />
    </div>
  );
}
