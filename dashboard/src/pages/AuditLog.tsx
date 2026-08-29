import React, { useEffect, useState } from 'react';
import { AuditTable } from '../components/AuditTable';
import { deployGuardApi } from '../api/deployguard';
import type { AuditRecord } from '../api/types';

export const AuditLogPage: React.FC = () => {
  const [audits, setAudits] = useState<AuditRecord[]>([]);

  useEffect(() => {
    deployGuardApi.getRollbackAudits().then(setAudits);
  }, []);

  return <AuditTable audits={audits} />;
};
