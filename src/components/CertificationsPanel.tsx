import { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Clock, AlertTriangle, CheckCircle, RefreshCw, Calendar, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SkeletonCertificationList, SkeletonStatCard } from '@/components/ui/skeleton';
import {
  useUserCertifications, 
  useCertifications, 
  useExpiringCertifications,
  useExpiredCertifications,
  useRenewCertification 
} from '@/hooks/useCertifications';
import { UserCertification, Certification } from '@/services/certificationsService';
import { CertificateActions } from '@/components/certifications/CertificateActions';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig = {
  active: { label: 'Ativa', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  expiring_soon: { label: 'Expirando', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  expired: { label: 'Expirada', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle },
  revoked: { label: 'Revogada', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: AlertTriangle },
};

const categoryConfig: Record<string, { label: string; color: string }> = {
  onboarding: { label: 'Onboarding', color: 'bg-blue-500/20 text-blue-400' },
  compliance: { label: 'Compliance', color: 'bg-purple-500/20 text-purple-400' },
  operacional: { label: 'Operacional', color: 'bg-orange-500/20 text-orange-400' },
  tecnico: { label: 'Técnico', color: 'bg-cyan-500/20 text-cyan-400' },
  comercial: { label: 'Comercial', color: 'bg-green-500/20 text-green-400' },
  general: { label: 'Geral', color: 'bg-gray-500/20 text-gray-400' },
};

function CertificationCard({ 
  userCert, 
  onRenew,
  isRenewing,
}: { 
  userCert: UserCertification; 
  onRenew: (id: string) => void;
  isRenewing?: boolean;
}) {
  const cert = userCert.certification;
  if (!cert) return null;

  const status = statusConfig[userCert.status];
  const StatusIcon = status.icon;
  const category = categoryConfig[cert.category] || categoryConfig.general;
  
  const daysUntilExpiry = userCert.expires_at 
    ? differenceInDays(new Date(userCert.expires_at), new Date())
    : null;

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-4 rounded-xl border ${
        isExpired 
          ? 'border-red-500/30 bg-red-500/5' 
          : isExpiringSoon 
            ? 'border-yellow-500/30 bg-yellow-500/5' 
            : 'border-border/50 bg-card/50'
      } backdrop-blur-sm`}
    >
      {cert.is_mandatory && (
        <div className="absolute -top-2 -right-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Obrigatória
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Certificação obrigatória para conformidade</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="text-4xl">{cert.icon}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground truncate">{cert.name}</h3>
            <Badge className={`${status.color} border text-xs`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>

          {cert.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{cert.description}</p>
          )}

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <Badge className={`${category.color} text-xs`}>{category.label}</Badge>
            
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Emitida: {format(new Date(userCert.issued_at), 'dd/MM/yyyy', { locale: ptBR })}
            </span>

            {userCert.expires_at && (
              <span className={`text-xs flex items-center gap-1 ${
                isExpired ? 'text-red-400' : isExpiringSoon ? 'text-yellow-400' : 'text-muted-foreground'
              }`}>
                <Clock className="w-3 h-3" />
                {isExpired 
                  ? `Expirou há ${Math.abs(daysUntilExpiry!)} dias`
                  : `Expira em ${daysUntilExpiry} dias`
                }
              </span>
            )}

            {userCert.renewal_count > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                {userCert.renewal_count}x renovada
              </span>
            )}
          </div>

          {(isExpiringSoon || isExpired) && (
            <Button 
              size="sm" 
              className="mt-3"
              variant={isExpired ? "destructive" : "default"}
              onClick={() => onRenew(userCert.id)}
              disabled={isRenewing}
            >
              {isRenewing ? (
                <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {isRenewing ? 'Renovando...' : isExpired ? 'Renovar Agora' : 'Agendar Renovação'}
            </Button>
          )}

          <CertificateActions userCert={userCert} />
        </div>
      </div>
    </motion.div>
  );
}

function AvailableCertificationCard({ cert }: { cert: Certification }) {
  const category = categoryConfig[cert.category] || categoryConfig.general;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm opacity-60"
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl grayscale">{cert.icon}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground truncate">{cert.name}</h3>
            {cert.is_mandatory && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Obrigatória
              </Badge>
            )}
          </div>

          {cert.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{cert.description}</p>
          )}

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <Badge className={`${category.color} text-xs`}>{category.label}</Badge>
            
            {cert.validity_months && (
              <span className="text-xs text-muted-foreground">
                Validade: {cert.validity_months} meses
              </span>
            )}

            <span className="text-xs text-primary">
              +{cert.xp_reward} XP | +{cert.coin_reward} 🪙
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function CertificationsPanel() {
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const { data: userCertifications, isLoading: loadingUserCerts } = useUserCertifications();
  const { data: allCertifications, isLoading: loadingAllCerts } = useCertifications();
  const { data: expiringCerts } = useExpiringCertifications(30);
  const { data: expiredCerts } = useExpiredCertifications();
  const renewMutation = useRenewCertification();

  const handleRenew = (id: string) => {
    setRenewingId(id);
    renewMutation.mutate(id, {
      onSettled: () => setRenewingId(null),
    });
  };

  const activeCerts = userCertifications?.filter(c => c.status === 'active') || [];
  const pendingCerts = allCertifications?.filter(
    cert => !userCertifications?.some(uc => uc.certification_id === cert.id)
  ) || [];
  const mandatoryPending = pendingCerts.filter(c => c.is_mandatory);

  const totalMandatory = allCertifications?.filter(c => c.is_mandatory).length || 0;
  const completedMandatory = userCertifications?.filter(
    uc => uc.certification?.is_mandatory && uc.status === 'active'
  ).length || 0;
  const compliancePercent = totalMandatory > 0 ? (completedMandatory / totalMandatory) * 100 : 0;

  if (loadingUserCerts || loadingAllCerts) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Minhas Certificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonStatCard key={i} className="h-20" />
            ))}
          </div>
          <SkeletonCertificationList items={3} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Minhas Certificações
          </CardTitle>
          
          {(expiringCerts?.length || 0) + (expiredCerts?.length || 0) > 0 && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {(expiringCerts?.length || 0) + (expiredCerts?.length || 0)} atenção
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Compliance Progress */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Conformidade - Certificações Obrigatórias</span>
            <span className="text-sm text-muted-foreground">
              {completedMandatory}/{totalMandatory}
            </span>
          </div>
          <Progress value={compliancePercent} className="h-2" />
          {mandatoryPending.length > 0 && (
            <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {mandatoryPending.length} certificação(ões) obrigatória(s) pendente(s)
            </p>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="text-2xl font-bold text-green-400">{activeCerts.length}</div>
            <div className="text-xs text-muted-foreground">Ativas</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="text-2xl font-bold text-yellow-400">{expiringCerts?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Expirando</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="text-2xl font-bold text-red-400">{expiredCerts?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Expiradas</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="text-2xl font-bold text-blue-400">{pendingCerts.length}</div>
            <div className="text-xs text-muted-foreground">Disponíveis</div>
          </div>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">
              Ativas ({activeCerts.length})
            </TabsTrigger>
            <TabsTrigger value="alerts" className="relative">
              Alertas
              {((expiringCerts?.length || 0) + (expiredCerts?.length || 0)) > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="available">
              Disponíveis ({pendingCerts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3 mt-4">
            {activeCerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma certificação ativa</p>
                <p className="text-xs">Complete treinamentos para obter certificações</p>
              </div>
            ) : (
              activeCerts.map(cert => (
                <CertificationCard 
                  key={cert.id} 
                  userCert={cert}
                  onRenew={handleRenew}
                  isRenewing={renewingId === cert.id}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="alerts" className="space-y-3 mt-4">
            {(expiringCerts?.length || 0) + (expiredCerts?.length || 0) === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400 opacity-50" />
                <p>Nenhum alerta de renovação</p>
                <p className="text-xs">Todas as certificações estão em dia!</p>
              </div>
            ) : (
              <>
                {expiredCerts?.map(cert => (
                  <CertificationCard 
                    key={cert.id} 
                    userCert={cert}
                    onRenew={handleRenew}
                    isRenewing={renewingId === cert.id}
                  />
                ))}
                {expiringCerts?.map(cert => (
                  <CertificationCard 
                    key={cert.id} 
                    userCert={cert}
                    onRenew={handleRenew}
                    isRenewing={renewingId === cert.id}
                  />
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="available" className="space-y-3 mt-4">
            {pendingCerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400 opacity-50" />
                <p>Parabéns!</p>
                <p className="text-xs">Você possui todas as certificações disponíveis</p>
              </div>
            ) : (
              pendingCerts.map(cert => (
                <AvailableCertificationCard key={cert.id} cert={cert} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
