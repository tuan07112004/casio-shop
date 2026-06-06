import './LogoMarquee.css'

const LOGO_SRC = '/images/logo.png'
const ITEM_COUNT = 12

const logos = Array.from({ length: ITEM_COUNT }, (_, i) => ({
  id: i,
  src: LOGO_SRC,
}))

const track = [...logos, ...logos]

export default function LogoMarquee() {
  return (
    <div className="logo-marquee">
      <div className="logo-track">
        {track.map((item, index) => (
          <img
            key={`${item.id}-${index}`}
            src={item.src}
            alt=""
            className="logo-marquee-img"
            width={160}
            height={48}
            draggable={false}
          />
        ))}
      </div>
    </div>
  )
}