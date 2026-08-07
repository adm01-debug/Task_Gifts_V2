import { motion } from 'framer-motion';
import { Award, AlertTriangle, CheckCircle, Users, Shield, Clock, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTeamCertificationStatus, useMandatoryCertifications } from '@/hooks/useCertifications';

export function TeamCertificationsPanel() {
  const { data: teamStatus, isLoading } = useTeamCertificationStatus();
  const { data: mandatoryCerts } = useMandatoryCertifications();

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalMandatory = mandatoryCerts?.length || 0;
  const teamSize = teamStatus?.length || 0;
  
  const criticalMembers = teamStatus?.filter(m => m.mandatoryMissing > 0 || m.expiredCertifications > 0) || [];
  const warningMembers = teamStatus?.filter(m => m.expiringCertifications > 0 && m.mandatoryMissing === 0 && m.expiredCertifications === 0) || [];
  const compliantMembers = teamStatus?.filter(m => m.mandatoryMissing === 0 && m.expiredCertifications === 0 && m.expiringCertifications === 0) || [];

  const teamComplianceRate = teamSize > 0 
    ? (compliantMembers.length / teamSize) * 100 
    : 0;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Certificações da Equipe
          </CardTitle>
          
          {criticalMembers.length > 0 && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {criticalMembers.length} não conformes
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Team Compliance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl bg-primary/5 border border-primary/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Conformidade Geral
              </span>
              <span className="text-2xl font-bold text-primary">{teamComplianceRate.toFixed(0)}%</span>
            </div>
            <Progress value={teamComplianceRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {compliantMembers.length} de {teamSize} colaboradores em dia
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-red-500/5 border border-red-500/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium">Crítico</span>
            </div>
            <div className="text-2xl font-bold text-red-400">{criticalMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              Certificações expiradas ou obrigatórias pendentes
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">Atenção</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">{warningMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              Certificações expirando em breve
            </p>
          </motion.div>
        </div>

        {/* Mandatory Certifications Summary */}
        {mandatoryCerts && mandatoryCerts.length > 0 && (
          <div className="p-4 rounded-xl border border-border/50 bg-card/30">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400" />
              Certificações Obrigatórias ({totalMandatory})
            </h4>
            <div className="flex flex-wrap gap-2">
              {mandatoryCerts.map(cert => (
                <Badge key={cert.id} variant="outline" className="text-xs">
                  {cert.icon} {cert.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Critical Members */}
        {criticalMembers.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2 text-red-400">
              <TrendingDown className="w-4 h-4" />
              Colaboradores em Não Conformidade
            </h4>
            
            <div className="space-y-2">
              {criticalMembers.map((member, index) => (
                <motion.div
                  key={member.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg border border-red-500/30 bg-red-500/5"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-red-500/20 text-red-400 text-xs">
                        {member.displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{member.displayName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{member.activeCertifications} ativas</span>
                        {member.expiredCertifications > 0 && (
                          <Badge className="bg-red-500/20 text-red-400 text-[10px] px-1">
                            {member.expiredCertifications} expiradas
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {member.mandatoryMissing > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              <Shield className="w-3 h-3 mr-1" />
                              {member.mandatoryMissing} pendentes
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Certificações obrigatórias não realizadas</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Warning Members */}
        {warningMembers.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2 text-yellow-400">
              <Clock className="w-4 h-4" />
              Próximas Renovações
            </h4>
            
            <div className="space-y-2">
              {warningMembers.map((member, index) => (
                <motion.div
                  key={member.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-yellow-500/20 text-yellow-400 text-xs">
                        {member.displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{member.displayName}</p>
                      <span className="text-xs text-muted-foreground">
                        {member.activeCertifications} ativas
                      </span>
                    </div>
                  </div>
                  
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    <Clock className="w-3 h-3 mr-1" />
                    {member.expiringCertifications} expirando
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Compliant Members */}
        {compliantMembers.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              Em Conformidade ({compliantMembers.length})
            </h4>
            
            <div className="flex flex-wrap gap-2">
              {compliantMembers.map(member => (
                <TooltipProvider key={member.userId}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar className="w-8 h-8 border-2 border-green-500/30">
                        <AvatarFallback className="bg-green-500/20 text-green-400 text-xs">
                          {member.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{member.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.activeCertifications} certificações ativas
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}

        {teamSize === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum membro na equipe</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
