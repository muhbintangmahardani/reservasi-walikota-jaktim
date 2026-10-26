'use client';

import React from 'react';
import { User, Mail, Building, Shield } from 'lucide-react';
import { useAuth } from '../../presentation/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../presentation/components/ui/card';
import { Badge } from '../../presentation/components/ui/badge';

export default function PengaturanProfilPage() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="pb-3 border-b border-border/60">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Pengaturan Akun & Profil
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Memuat profil pengguna...
          </p>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3.5 pb-4 border-b border-border/60">
              <div className="w-12 h-12 rounded-lg bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="pb-3 border-b border-border/60">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Pengaturan Akun & Profil
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Informasi identitas akun dan kewenangan sistem E-Reservasi.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3.5 pb-4 border-b border-border/60">
            <div className="w-12 h-12 rounded-lg bg-zinc-900 text-zinc-50 flex items-center justify-center font-bold text-base shadow-xs">
              {currentUser.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="font-semibold text-sm text-foreground">{currentUser.fullName}</h2>
              <p className="text-xs text-muted-foreground">{currentUser.unitName}</p>
              <Badge variant="outline" className="mt-1 text-[10px]">
                {currentUser.role}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-md bg-muted/40 border border-border/60">
              <span className="text-muted-foreground block text-[10px] mb-0.5">Email Kedinasan:</span>
              <span className="font-semibold text-foreground">{currentUser.email}</span>
            </div>
            <div className="p-3 rounded-md bg-muted/40 border border-border/60">
              <span className="text-muted-foreground block text-[10px] mb-0.5">Tipe Pengguna:</span>
              <span className="font-semibold text-foreground capitalize">{currentUser.userType}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
