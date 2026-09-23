"use client";
import styles from "./stores.module.css";

const STORES = [
  {
    id: "delhi",
    eyebrow: "Flagship Boutique",
    name: "New Delhi",
    address: "New Delhi, India",
    hours: "Mon – Sat: 11:00 AM – 8:00 PM",
    phone: "+91 77770 45554",
    whatsapp: "917777045554",
    mapSrc:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3510.557!2d77.1458549!3d28.4939196!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d1f3a7a83045b%3A0x5e58dc27b25c6b0c!2sHeer%20Ranjha!5e0!3m2!1sen!2sin!4v1691000000000!5m2!1sen!2sin",
    mapUrl:
      "https://www.google.com/maps/place/Heer+Ranjha/@28.4939196,77.1458549,17z/data=!3m1!4b1!4m6!3m5!1s0x390d1f3a7a83045b:0x5e58dc27b25c6b0c!8m2!3d28.4939196!4d77.1458549!16s%2Fg%2F11mrqrp206",
  },
  {
    id: "bareilly",
    eyebrow: "Atelier & Boutique",
    name: "Bareilly",
    address: "Bareilly, Uttar Pradesh, India",
    hours: "Mon – Sat: 10:30 AM – 8:30 PM",
    phone: "+91 77770 45554",
    whatsapp: "917777045554",
    mapSrc:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3510.557!2d79.4245842!3d28.3406194!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39a0018e160cfb73%3A0xd62b5fb2cb3c81e9!2sHEER%20RANJHA!5e0!3m2!1sen!2sin!4v1691000000000!5m2!1sen!2sin",
    mapUrl:
      "https://www.google.com/maps/place/HEER+RANJHA/@28.3406194,79.4245842,17z/data=!3m1!4b1!4m6!3m5!1s0x39a0018e160cfb73:0xd62b5fb2cb3c81e9!8m2!3d28.3406194!4d79.4245842!16s%2Fg%2F11thn2mj58",
  },
];

export default function StoresContent() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <p className={`eyebrow ${styles.heroEyebrow}`}>Our Boutiques</p>
        <h1 className={`display ${styles.heroTitle}`}>Visit Us In Person</h1>
        <p className={styles.heroSub}>
          Step inside either of our boutiques and experience the touch of handcrafted luxury.
          Our artisans and style consultants are on hand to guide you.
        </p>
      </section>

      {/* Stores */}
      <section className={styles.stores}>
        {STORES.map((store) => (
          <div key={store.id} className={styles.storeCard}>
            {/* Map */}
            <div className={styles.mapWrap}>
              <iframe
                src={store.mapSrc}
                className={styles.map}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${store.name} Store Location`}
              />
            </div>

            {/* Info */}
            <div className={styles.storeInfo}>
              <p className={`eyebrow ${styles.storeEyebrow}`}>{store.eyebrow}</p>
              <h2 className={`display ${styles.storeName}`}>{store.name}</h2>

              <dl className={styles.detailList}>
                <div className={styles.detailRow}>
                  <dt className={styles.detailIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </dt>
                  <dd className={styles.detailText}>{store.address}</dd>
                </div>

                <div className={styles.detailRow}>
                  <dt className={styles.detailIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </dt>
                  <dd className={styles.detailText}>{store.hours}</dd>
                </div>

                <div className={styles.detailRow}>
                  <dt className={styles.detailIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.18 6.18l.86-.86a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.79 16.92z" />
                    </svg>
                  </dt>
                  <dd className={styles.detailText}>{store.phone}</dd>
                </div>
              </dl>

              <div className={styles.actions}>
                <a
                  href={store.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.dirBtn}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polygon points="3 11 22 2 13 21 11 13 3 11" />
                  </svg>
                  Get Directions
                </a>
                <a
                  href={`https://wa.me/${store.whatsapp}?text=${encodeURIComponent("Hi, I'd like to visit the " + store.name + " boutique. Can you share more details?")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.waBtn}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                  </svg>
                  WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Book Appointment CTA */}
      <section className={styles.cta}>
        <p className={`eyebrow ${styles.ctaEyebrow}`}>Personalised Experience</p>
        <h2 className={`display ${styles.ctaTitle}`}>Book a Private Consultation</h2>
        <p className={styles.ctaSub}>
          Let us curate a selection based on your occasion, fabric preference, and silhouette. Available at both boutiques, by appointment.
        </p>
        <a
          href={`https://wa.me/917777045554?text=${encodeURIComponent("Hi, I'd like to book a private consultation at Heer Ranjha.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaBtn}
        >
          <span>Schedule a Visit</span>
        </a>
      </section>
    </div>
  );
}
