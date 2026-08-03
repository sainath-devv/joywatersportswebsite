export const ACTIVITY_PRICES: Record<string, number> = {
  "PARASAILING": 2500,
  "JET SKI": 700,
  "FLYING FISH": 600,
  "SPEED BOAT": 500,
  "BANANA BOAT": 500,
  "CRAZY SOFA": 500,
  "DOUGHNUT BOAT": 500,
  "ATV": 300,
  "PACKAGE 2500": 2500,
  "OVERALL": 4500
};

export const EXPERIENCES = [
  {
    id: "parasailing",
    title: "Parasailing",
    price: 2500,
    image: "https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/parasailingmain.png",
    images: [
      "https://images.unsplash.com/photo-1544298155-251f251de48b?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1544298155-251f251de48b?auto=format&fit=crop&q=80&w=1000"
    ],
    description: "Fly high above the blue seas of Varkala and feel the ultimate thrill and panoramic coastal views.",
    intensity: "High Thrill"
  },
  {
    id: "jetski",
    title: "Jet Ski",
    price: 700,
    image: "https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/jetski.png",
    images: [
      "https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/jetski.png"
    ],
    description: "Speed across the ocean waves on a powerful personal watercraft. Ideal for thrill seekers.",
    intensity: "High Thrill"
  },
  {
    id: "flyingfish",
    title: "Flying Fish",
    price: 600,
    image: "https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/flyingfish.png",
    images: [
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=80&w=1000"
    ],
    description: "Hang on tight as this inflatable fish-shaped raft slides and catches air over ocean waves.",
    intensity: "High Thrill"
  },
  {
    id: "speedboat",
    title: "Speed Boat",
    price: 500,
    image: "https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/speedboat.png",
    images: [
      "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&q=80&w=1000"
    ],
    description: "A fast and roaring group boat ride around the Varkala coastline.",
    intensity: "Medium Intensity"
  },
  {
    id: "bananaboat",
    title: "Banana Boat",
    price: 500,
    image: "https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/Bananaboat.png",
    images: [
      "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&q=80&w=1000"
    ],
    description: "A hilarious and splashing ride on a banana-shaped inflatable pulled by a speed boat, perfect for families and groups.",
    intensity: "Medium Intensity"
  },
  {
    id: "crazysofa",
    title: "Crazy Sofa",
    price: 500,
    image: "https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/crazysofa.png",
    images: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1000"
    ],
    description: "Sit tight, hold on, and bounce over the ocean waves with our crazy inflatable sofa pulled at high speed.",
    intensity: "High Thrill"
  },
  {
    id: "doughnutboat",
    title: "Doughnut Boat",
    price: 500,
    image: "https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/Dougnutboat.png",
    images: [
      "https://images.unsplash.com/photo-1618083707368-b3823daa2726?auto=format&fit=crop&q=80&w=1000"
    ],
    description: "A spinning, circular tube ride on the waves that will leave you laughing and covered in ocean spray.",
    intensity: "High Thrill"
  },
  {
    id: "atv",
    title: "ATV",
    price: 300,
    image: "https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/atv.png",
    images: [
      "https://images.unsplash.com/photo-1551698618-1ffd0197e2b6?auto=format&fit=crop&q=80&w=1000"
    ],
    description: "Ride an All-Terrain Vehicle on the soft sandy shores of Varkala for a fun beach adventure.",
    intensity: "Medium Intensity"
  }
];

export function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  const parts = timeStr.split(':');
  const hours = Number(parts[0]);
  const minutes = parts[1] ? Number(parts[1]) : 0;
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}
