import Image from "next/image";

interface GiftCardProps {
  gift: {
    id: string;
    title: string;
    message: string;
    imageUrl: string;
    blurDataUrl?: string | null;
    createdAt: string;
  };
}

export default function GiftCard({ gift }: GiftCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-colors">
      <div className="aspect-video relative rounded-lg overflow-hidden mb-4">
        <Image
          src={gift.imageUrl}
          alt={gift.title}
          fill
          className="object-cover"
          placeholder={gift.blurDataUrl ? "blur" : "empty"}
          blurDataURL={gift.blurDataUrl || undefined}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-white">{gift.title}</h3>
        <p className="text-emerald-100 text-sm leading-relaxed">{gift.message}</p>
        <div className="text-xs text-emerald-200">
          {new Date(gift.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
