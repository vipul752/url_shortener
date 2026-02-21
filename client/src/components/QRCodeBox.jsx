import { QRCodeCanvas } from "qrcode.react";

export default function QRCodeBox({ url }) {
  return (
    <div className="mt-4 flex flex-col items-center">
      <p className="text-gray-400 mb-2">Scan QR</p>
      <QRCodeCanvas
        value={url}
        size={180}
        bgColor="#111827"
        fgColor="#ffffff"
      />
    </div>
  );
}
