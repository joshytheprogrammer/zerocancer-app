import QRCode from 'react-qr-code'

const CheckInQR = ({ checkInCode }: { checkInCode: string }) => {
  return (
    <div className="bg-white p-4">
      <QRCode
        value={`${window.location.origin}/api/center/appointments/verify-checkin/${checkInCode}`}
      />
    </div>
  )
}

export default CheckInQR
