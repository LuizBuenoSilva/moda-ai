"use client";

import { LookGerado } from "@/types/look";
import LookCard from "./LookCard";

interface LookResultListProps {
  looks: LookGerado[];
}

export default function LookResultList({ looks }: LookResultListProps) {
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Seus <span className="gradient-text">3 Looks</span> Personalizados
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {looks.map((look, i) => (
          <LookCard key={i} look={look} index={i} />
        ))}
      </div>
    </div>
  );
}
