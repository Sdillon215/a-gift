import Image from "next/image";

interface GiftCardProps {
  gift: {
    id: string;
    title: string;
    message: string;
    imageUrl: string;
    blurDataUrl?: string | null;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
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
        
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {gift.user.name ? gift.user.name.charAt(0).toUpperCase() : gift.user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-emerald-200 text-sm">
              {gift.user.name || gift.user.email}
            </span>
          </div>
          <div className="text-xs text-emerald-200">
            {new Date(gift.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
