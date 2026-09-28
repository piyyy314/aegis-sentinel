/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Activity,
  Terminal,
  BookOpen,
  Newspaper,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Download,
  Search,
  Menu,
  X,
  ArrowUpRight,
  Filter,
  Lock,
  HardDrive,
  Cpu,
  Copy,
  Check,
  Radio,
  FileCheck,
  ChevronRight,
  Layers,
  Database,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  Zap,
  Printer,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  ComposedChart
} from 'recharts';
import { jsPDF } from 'jspdf';

// ============================================================================
// Types
// ============================================================================

export type SecurityStatus = 'nominal' | 'warning' | 'critical' | 'neutral';

export interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  status?: SecurityStatus;
  statusLabel?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  icon: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TelemetryEvent {
  id: string;
  timestamp: string;
  source: string;
  category: 'Network' | 'Integrity' | 'Cryptography' | 'Access';
  severity: 'nominal' | 'warning' | 'critical';
  summary: string;
  target: string;
  details: string;
  mitreRef?: string;
}

interface CryptoSBOMItem {
  id: string;
  component: string;
  version: string;
  primitive: string;
  algorithmClass: 'Legacy Classical' | 'Symmetric Standard' | 'Post-Quantum (NIST FIPS 203/204)' | 'Hybrid KEM';
  riskLevel: 'Critical' | 'Moderate' | 'Compliant';
  timelineTarget: string;
  recommendedAction: string;
}

interface DetectionRule {
  id: string;
  title: string;
  mitreId: string;
  technique: string;
  targetLog: string;
  eventIds: string[];
  severity: 'High' | 'Medium' | 'Critical';
  logicSummary: string;
  sigmaSnippet: string;
}

export interface AlertTrendPoint {
  day: string;
  fullDate: string;
  criticalAlerts: number;
  warnings: number;
  mitigated: number;
  scansBlocked: number;
  peakVector?: string;
  notes?: string;
}

// ============================================================================
// Reusable DashboardCard Component
// ============================================================================

export function DashboardCard({
  title,
  value,
  subtitle,
  status = 'neutral',
  statusLabel,
  trend,
  icon: Icon,
  action,
  children,
  className = '',
  onClick,
}: DashboardCardProps) {
  // Semantic status configuration compliant with accessibility (text + icon, no hue alone)
  const statusConfig = {
    nominal: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      badgeBg: 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-950/50 border border-emerald-800/30',
      indicator: 'bg-emerald-400',
      defaultLabel: 'Nominal',
      DefaultIcon: CheckCircle2,
    },
    warning: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      badgeBg: 'bg-amber-950/40 text-amber-300 border border-amber-800/40',
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-950/50 border border-amber-800/30',
      indicator: 'bg-amber-400',
      defaultLabel: 'Warning',
      DefaultIcon: AlertTriangle,
    },
    critical: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      badgeBg: 'bg-rose-950/40 text-rose-300 border border-rose-800/40',
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-950/50 border border-rose-800/30',
      indicator: 'bg-rose-400',
      defaultLabel: 'Critical',
      DefaultIcon: AlertCircle,
    },
    neutral: {
      border: 'border-slate-800 hover:border-slate-700',
      badgeBg: 'bg-slate-900 text-slate-300 border border-slate-800',
      iconColor: 'text-slate-400',
      iconBg: 'bg-slate-900 border border-slate-800',
      indicator: 'bg-slate-400',
      defaultLabel: 'Informational',
      DefaultIcon: Activity,
    },
  }[status];

  const StatusIcon = statusConfig.DefaultIcon;

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col justify-between p-5 bg-slate-900/70 backdrop-blur-sm border rounded-xl transition-all duration-200 ${
        statusConfig.border
      } ${onClick ? 'cursor-pointer hover:bg-slate-900/90' : ''} ${className}`}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${statusConfig.iconBg}`}>
              <Icon className={`w-5 h-5 ${statusConfig.iconColor}`} />
            </div>
            <div>
              <p className="text-xs font-medium tracking-wide uppercase text-slate-400">
                {title}
              </p>
              {statusLabel && (
                <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.indicator}`} />
                  <span className="text-slate-300 font-medium">
                    {statusLabel}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status Label Box */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium tracking-tight ${statusConfig.badgeBg}`}
          >
            <StatusIcon className="w-3 h-3 shrink-0" />
            <span>{statusLabel || statusConfig.defaultLabel}</span>
          </div>
        </div>

        {/* Primary Metric Value */}
        <div className="my-2">
          <div className="text-3xl font-bold tracking-tight text-white font-mono">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Children Content (Breakdown, bars, mini sparklines) */}
      {children && <div className="mt-3 pt-3 border-t border-slate-800/80">{children}</div>}

      {/* Footer / Trend / Action Row */}
      {(trend || action) && (
        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/60 text-xs">
          {trend ? (
            <div className="flex items-center gap-1.5 text-slate-400">
              <span
                className={`flex items-center font-mono font-medium ${
                  trend.isPositive ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                <ArrowUpRight className={`w-3.5 h-3.5 ${trend.isPositive ? '' : 'rotate-90'}`} />
                {trend.value}
              </span>
              {trend.label && <span className="text-slate-500">· {trend.label}</span>}
            </div>
          ) : (
            <div />
          )}

          {action && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Application Component
// ============================================================================

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<
    'overview' | 'telemetry' | 'sbom' | 'detection' | 'newsletter'
  >('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'nominal' | 'warning' | 'critical'>('all');
  const [selectedEvent, setSelectedEvent] = useState<TelemetryEvent | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 7-Day Alert Trend State for Telemetry Tab (Recharts)
  const [trendView, setTrendView] = useState<'critical' | 'comparison' | 'all'>('comparison');
  const [alertTrendData, setAlertTrendData] = useState<AlertTrendPoint[]>([
    {
      day: 'Sep 18',
      fullDate: '2026-09-18',
      criticalAlerts: 4,
      warnings: 12,
      mitigated: 4,
      scansBlocked: 110,
      peakVector: 'API Fuzzing Probe',
      notes: 'Automated honeypot drop on port 22222',
    },
    {
      day: 'Sep 19',
      fullDate: '2026-09-19',
      criticalAlerts: 7,
      warnings: 16,
      mitigated: 7,
      scansBlocked: 142,
      peakVector: 'SSH Dictionary Spray',
      notes: 'Rate-limiting triggered on gateway',
    },
    {
      day: 'Sep 20',
      fullDate: '2026-09-20',
      criticalAlerts: 2,
      warnings: 9,
      mitigated: 2,
      scansBlocked: 89,
      peakVector: 'Certificate Expiry Warning',
      notes: 'Low noise window, routine orbital ping',
    },
    {
      day: 'Sep 21',
      fullDate: '2026-09-21',
      criticalAlerts: 11,
      warnings: 24,
      mitigated: 10,
      scansBlocked: 235,
      peakVector: 'Kerberoasting & RF Micro-Jitter',
      notes: 'Active Directory TGS RC4 request storm + SDR phase cancellation',
    },
    {
      day: 'Sep 22',
      fullDate: '2026-09-22',
      criticalAlerts: 5,
      warnings: 15,
      mitigated: 5,
      scansBlocked: 120,
      peakVector: 'TLS Downgrade Negotiation',
      notes: 'Microservice forced to ML-KEM baseline',
    },
    {
      day: 'Sep 23',
      fullDate: '2026-09-23',
      criticalAlerts: 8,
      warnings: 19,
      mitigated: 8,
      scansBlocked: 184,
      peakVector: 'TR-069 ACS Abuse Probe',
      notes: 'VSAT modem interface access blocked',
    },
    {
      day: 'Sep 24',
      fullDate: '2026-09-24 (Today)',
      criticalAlerts: 3,
      warnings: 8,
      mitigated: 3,
      scansBlocked: 96,
      peakVector: 'Active Directory TGS RC4 (EVT-8937)',
      notes: 'Quarantined & under Blue Team verification',
    },
  ]);

  // Executive PDF State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);

  // Mock Telemetry Data
  const [events, setEvents] = useState<TelemetryEvent[]>([
    {
      id: 'EVT-8941',
      timestamp: '13:48:21',
      source: 'AEGIS_FIM_CORE',
      category: 'Integrity',
      severity: 'nominal',
      summary: 'Verified cryptographic hashes on 38 mission-critical configs',
      target: '/etc/satcom/modem_gateway.conf',
      details: 'Automated SHA-256 integrity baseline match. Zero unauthorized drift detected across protected root partition.',
    },
    {
      id: 'EVT-8940',
      timestamp: '13:45:09',
      source: 'VSAT_RF_MONITOR',
      category: 'Network',
      severity: 'warning',
      summary: 'Carrier signal SNR dropped by 1.8 dB on secondary Ku-band transponder',
      target: 'Transponder 4B (Downlink 11.74 GHz)',
      details: 'Minor atmospheric attenuation or orbital drift. Micro-Doppler signature remained within baseline nominal tolerances.',
    },
    {
      id: 'EVT-8939',
      timestamp: '13:42:33',
      source: 'HONEYPOT_SENTRY',
      category: 'Access',
      severity: 'nominal',
      summary: 'Probing connection dropped and logged on isolated trap port 22222',
      target: '198.51.100.84 -> Port 22222',
      details: 'Adversary scanner received synthetic banner. Immediate rate-limiting and temporary IP quarantine rule enacted.',
    },
    {
      id: 'EVT-8938',
      timestamp: '13:30:14',
      source: 'CRYPTO_AUDIT_DAEMON',
      category: 'Cryptography',
      severity: 'warning',
      summary: 'Internal microservice negotiated TLS 1.2 with legacy RSA-2048 key exchange',
      target: 'auth-service.internal:8443',
      details: 'Identified non-PQC cipher suite (TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384). Flagged for mandatory migration to ML-KEM/Kyber-768 hybrid.',
      mitreRef: 'M1041 (Encrypt Sensitive Information)',
    },
    {
      id: 'EVT-8937',
      timestamp: '13:12:05',
      source: 'SIEM_CORRELATOR',
      category: 'Access',
      severity: 'critical',
      summary: 'High-frequency Kerberos TGS request with RC4-HMAC ticket encryption',
      target: 'Active Directory Domain Controller (Event ID 4769)',
      details: 'Potential credential audit probe / Kerberoasting reconnaissance. User account: svc_satcom_telemetry. SIEM rule triggered threshold alert.',
      mitreRef: 'T1558.003 (Steal or Forge Kerberos Tickets)',
    },
  ]);

  // Crypto SBOM Inventory
  const cryptoInventory: CryptoSBOMItem[] = [
    {
      id: 'CSB-01',
      component: 'OpenSSL Crypto Core',
      version: '3.2.1-pqc-preview',
      primitive: 'ML-KEM-768 (Kyber)',
      algorithmClass: 'Post-Quantum (NIST FIPS 203/204)',
      riskLevel: 'Compliant',
      timelineTarget: 'NIST 2026 Target Met',
      recommendedAction: 'Maintain current post-quantum key encapsulation baseline.',
    },
    {
      id: 'CSB-02',
      component: 'VSAT Firmware Boot Signer',
      version: '2.14.0',
      primitive: 'RSA-2048 / SHA-256',
      algorithmClass: 'Legacy Classical',
      riskLevel: 'Critical',
      timelineTarget: 'Deprecate by Q4 2026',
      recommendedAction: 'Transition root-of-trust firmware signature to ML-DSA-65 (Dilithium) or stateful hash-based LMS.',
    },
    {
      id: 'CSB-03',
      component: 'Payload Storage Engine',
      version: '1.8.4',
      primitive: 'AES-256-GCM',
      algorithmClass: 'Symmetric Standard',
      riskLevel: 'Compliant',
      timelineTarget: 'Safe through 2035+',
      recommendedAction: '256-bit symmetric strength provides adequate quantum margin against Grover search.',
    },
    {
      id: 'CSB-04',
      component: 'Inter-Satellite Tunnel Gateway',
      version: '4.1.0',
      primitive: 'X25519 + Kyber-768 Hybrid',
      algorithmClass: 'Hybrid KEM',
      riskLevel: 'Compliant',
      timelineTarget: 'NIST Standardized',
      recommendedAction: 'Combines classical elliptic curve security with post-quantum lattice resilience.',
    },
    {
      id: 'CSB-05',
      component: 'Internal API Gateway Auth',
      version: '0.9.8 (Legacy)',
      primitive: 'ECDSA P-256',
      algorithmClass: 'Legacy Classical',
      riskLevel: 'Critical',
      timelineTarget: 'Phase-out Mandatory',
      recommendedAction: 'Vulnerable to polynomial-time Shor factorization on FTQC hardware. Upgrade to Falcon-512 or ML-DSA.',
    },
  ];

  // Defensive Detection Blueprints (MITRE ATT&CK / Sigma)
  const detectionRules: DetectionRule[] = [
    {
      id: 'RULE-T1055',
      title: 'Suspicious Cross-Process Memory Allocation & Thread Injection',
      mitreId: 'T1055',
      technique: 'Process Injection',
      targetLog: 'Sysmon Event ID 8 & Event ID 10',
      eventIds: ['Sysmon 8', 'Sysmon 10', 'Sysmon 7'],
      severity: 'Critical',
      logicSummary: 'Detects unexpected VirtualAllocEx or WriteProcessMemory calls originating from unverified parent executables targeting critical system runtimes.',
      sigmaSnippet: `title: Suspicious Remote Process Thread Creation\nlogsource:\n  product: windows\n  service: sysmon\ndetection:\n  selection:\n    EventID: 8\n    TargetImage|endswith:\n      - '\\lsass.exe'\n      - '\\explorer.exe'\n    StartFunction: 'LoadLibraryA'\n  condition: selection`,
    },
    {
      id: 'RULE-T1558',
      title: 'Kerberos Service Ticket Request with Downgraded RC4 Encryption',
      mitreId: 'T1558.003',
      technique: 'Steal or Forge Kerberos Tickets: Kerberoasting',
      targetLog: 'Windows Security Event ID 4769',
      eventIds: ['Security 4769'],
      severity: 'High',
      logicSummary: 'Detects requested Ticket Encryption Type 0x17 (RC4-HMAC) for service principals. Modern active directory environments should enforce AES-128 (0x12) or AES-256 (0x13).',
      sigmaSnippet: `title: Kerberos RC4 Ticket Request Detection\nlogsource:\n  product: windows\n  service: security\ndetection:\n  selection:\n    EventID: 4769\n    TicketEncryptionType: '0x17'\n    ServiceName|contains: '$'\n  condition: selection`,
    },
    {
      id: 'RULE-T1562',
      title: 'Antivirus and EDR Security Service State Modification',
      mitreId: 'T1562.001',
      technique: 'Impair Defenses: Disable or Modify Tools',
      targetLog: 'System Event ID 7036 & PowerShell 4104',
      eventIds: ['System 7036', 'PowerShell 4104'],
      severity: 'Critical',
      logicSummary: 'Alerts when endpoint protection service status changes to STOPPED without standard change-management ticket authorization tags.',
      sigmaSnippet: `title: Security Service Termination Attempt\nlogsource:\n  product: windows\n  service: system\ndetection:\n  selection:\n    EventID: 7036\n    ServiceName|contains:\n      - 'WinDefend'\n      - 'Sentinel'\n      - 'CrowdStrike'\n  condition: selection`,
    },
  ];

  // Newsletter & Research Findings Content
  const newsletterDraft = {
    title: 'Cybersecurity Lab Findings & Research Bulletin (Q3/Q4 Edition)',
    author: 'Defensive Security & Quantum Systems Research Lab',
    date: 'Published September 2026',
    sections: [
      {
        heading: '1. Executive Abstract: The Dual-Track Post-Quantum Transition',
        body: 'As the NIST Post-Quantum Cryptography standards (FIPS 203 ML-KEM, FIPS 204 ML-DSA, and FIPS 205 SLH-DSA) enter full operational enforcement, our lab analyzed 120 satellite communication endpoints and enterprise service meshes. While 78% of edge gateways have deployed hybrid key encapsulation mechanisms, legacy embedded systems still exhibit persistent reliance on RSA-2048 and static ECDSA certificates.',
      },
      {
        heading: '2. Telemetry Architecture for EDR Evasion & Injection Detection',
        body: 'Modern advanced persistent threats increasingly leverage unbacked memory execution, synthetic direct syscall resolution, and entropy masking. Our telemetry framework demonstrates that relying solely on API user-mode hooks is insufficient. Defensive monitoring must correlate kernel ETW (Event Tracing for Windows) providers with memory page permission transitions (PAGE_EXECUTE_READWRITE) and hardware performance counter anomalies.',
      },
      {
        heading: '3. Hardening Satellite (VSAT) Communication Networks',
        body: 'Satellite radio links face unique attack surfaces, including physical micro-Doppler spoofing, rogue ground station insertion, and TR-069 management console brute-forcing. Implementing micro-segmentation, dedicated out-of-band management VLANs, and automated file integrity monitoring ensures resilience even under compromised uplink conditions.',
      },
    ],
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const matchesSearch =
        evt.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.target.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeverity =
        severityFilter === 'all' || evt.severity === severityFilter;
      return matchesSearch && matchesSeverity;
    });
  }, [events, searchQuery, severityFilter]);

  // Handlers
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const simulatedProbe: TelemetryEvent = {
        id: `EVT-${Math.floor(8942 + Math.random() * 50)}`,
        timestamp: new Date().toLocaleTimeString('en-GB'),
        source: 'SDR_PHASE_MONITOR',
        category: 'Network',
        severity: 'nominal',
        summary: 'Routine transponder beam calibration verified zero phase anomaly',
        target: 'Orbital Transponder Feed #1',
        details: 'Automated spectrum analysis confirmed 0.014 rad baseline deviation, well within nominal envelope.',
      };
      setEvents((prev) => [simulatedProbe, ...prev.slice(0, 7)]);
      setIsRefreshing(false);
    }, 600);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          status: 'Nominal',
          pqcReadinessScore: 94.2,
          telemetryEvents: events,
          cryptographicInventory: cryptoInventory,
        },
        null,
        2
      )
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aegis-security-audit-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Simulate Inbound Alert to demonstrate real-time Recharts and table interactivity
  const handleSimulateCriticalProbe = () => {
    const probeId = `EVT-${Math.floor(8950 + Math.random() * 100)}`;
    const newEvent: TelemetryEvent = {
      id: probeId,
      timestamp: new Date().toLocaleTimeString('en-GB'),
      source: 'HONEYPOT_SENTRY',
      category: 'Access',
      severity: 'critical',
      summary: 'Simulated Inbound High-Entropy Payload Probe Intercepted',
      target: '198.51.100.99 -> Trap Port 22222',
      details: 'Automated defense engine triggered immediate IP isolation and unhooking protection. Verified zero memory exposure.',
      mitreRef: 'T1055 (Process Injection)',
    };

    setEvents((prev) => [newEvent, ...prev]);

    // Increment today's count in the 7-day trend data
    setAlertTrendData((prev) =>
      prev.map((pt, idx) =>
        idx === prev.length - 1
          ? {
              ...pt,
              criticalAlerts: pt.criticalAlerts + 1,
              mitigated: pt.mitigated + 1,
              scansBlocked: pt.scansBlocked + 14,
              notes: 'Simulated probe automatically isolated & quarantined',
            }
          : pt
      )
    );
  };

  // PDF Report Generation for Executive Overview
  const handleDownloadExecutivePdf = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const now = new Date();

        // ---------------- PAGE 1 ----------------
        // Top Banner
        doc.setFillColor(15, 23, 42); // #0f172a
        doc.rect(0, 0, pageWidth, 28, 'F');

        // Cyan accent line
        doc.setFillColor(6, 182, 212); // #06b6d4
        doc.rect(0, 28, pageWidth, 1.5, 'F');

        // Brand & Title
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('AEGIS SENTINEL', 14, 13);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text('EXECUTIVE SECURITY STATUS & FORENSIC AUDIT REPORT', 14, 20);

        // Header Metadata Right
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(56, 189, 248);
        doc.text('CLASSIFICATION: DEFENSIVE OPERATIONS // OFFICIAL', pageWidth - 14, 12, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(203, 213, 225);
        doc.text(`Generated: ${now.toUTCString()}`, pageWidth - 14, 18, { align: 'right' });
        doc.text('Station: AEGIS-STATION-04 | Node ID: AS-NODE-892', pageWidth - 14, 23, { align: 'right' });

        let y = 36;

        // 1. Executive Posture Box
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(14, y, pageWidth - 28, 25, 2, 2, 'FD');

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.text('1. EXECUTIVE POSTURE ASSESSMENT', 18, y + 6.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        const summaryParagraph =
          'Overall security posture is evaluated as NOMINAL (99.4% operational stability). Zero breaches confirmed. Post-Quantum Cryptographic migration is progressing ahead of schedule (94.2% compliant with NIST FIPS 203/204). Active honeypot traps and self-healing File Integrity Monitors (FIM) have successfully neutralized 1,248 perimeter probes with a sub-second containment SLA (< 0.8s).';
        const splitSummary = doc.splitTextToSize(summaryParagraph, pageWidth - 36);
        doc.text(splitSummary, 18, y + 12);

        y += 31;

        // 2. Core Metrics Cards
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.text('2. CORE SECURITY METRICS & HEALTH INDICATORS', 14, y);

        y += 4.5;
        const cardW = (pageWidth - 28 - 9) / 4;
        const metrics = [
          { label: 'PQC READINESS', val: '94.2%', sub: 'NIST FIPS 203/204', status: 'Compliant' },
          { label: 'THREAT INTERCEPTS', val: '1,248', sub: 'Perimeter Blocked', status: '0 Breaches' },
          { label: 'HOST INTEGRITY', val: '100%', sub: '38 Config Baselines', status: 'Zero Drift' },
          { label: 'SIEM CORRELATION', val: '3 Alerts', sub: '1 Critical / 2 Warn', status: 'Active Triage' },
        ];

        metrics.forEach((m, idx) => {
          const x = 14 + idx * (cardW + 3);
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(x, y, cardW, 22, 2, 2, 'FD');

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(m.label, x + 3.5, y + 5.5);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(15, 23, 42);
          doc.text(m.val, x + 3.5, y + 12.5);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          doc.text(m.sub, x + 3.5, y + 17.5);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          if (m.status === '0 Breaches' || m.status === 'Compliant' || m.status === 'Zero Drift') {
            doc.setTextColor(16, 149, 83);
          } else {
            doc.setTextColor(217, 119, 6);
          }
          doc.text(m.status, x + cardW - 3.5, y + 5.5, { align: 'right' });
        });

        y += 28;

        // 3. 7-Day Critical Alerts Trend Summary
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.text('3. 7-DAY CRITICAL ALERT FREQUENCY & MITIGATION TREND', 14, y);

        y += 4.5;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, y, pageWidth - 28, 24, 2, 2, 'FD');

        // Trend Mini Stats Row
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text('7-Day Critical Alerts: 40 Total', 18, y + 6);
        doc.text('Auto-Mitigation Rate: 97.5% (39 Contained)', 75, y + 6);
        doc.text('Peak Incident Window: Sep 21 (11 Alerts)', 140, y + 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const trendSummaryText =
          'Daily frequency of high-severity alerts over the past 7 days (Sep 18 - Sep 24): [Sep 18: 4] [Sep 19: 7] [Sep 20: 2] [Sep 21: 11] [Sep 22: 5] [Sep 23: 8] [Sep 24: 3]. All critical spikes were contained by the autonomous FIM vault and software-defined radio phase cancellation with an average containment time of 0.78s.';
        const splitTrend = doc.splitTextToSize(trendSummaryText, pageWidth - 36);
        doc.text(splitTrend, 18, y + 12);

        y += 30;

        // 4. Cryptographic Posture Table
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.text('4. CRYPTOGRAPHIC POSTURE & NIST PQC COMPLIANCE INVENTORY', 14, y);

        y += 4.5;
        doc.setFillColor(30, 41, 59);
        doc.rect(14, y, pageWidth - 28, 6, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text('COMPONENT / LAYER', 18, y + 4.2);
        doc.text('PRIMITIVE IN USE', 65, y + 4.2);
        doc.text('ALGORITHM CLASS', 105, y + 4.2);
        doc.text('RISK LEVEL', 145, y + 4.2);
        doc.text('COMPLIANCE TARGET', pageWidth - 18, y + 4.2, { align: 'right' });

        y += 6;

        cryptoInventory.forEach((item, idx) => {
          doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
          doc.rect(14, y, pageWidth - 28, 6.8, 'F');
          doc.setDrawColor(226, 232, 240);
          doc.line(14, y + 6.8, pageWidth - 14, y + 6.8);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(30, 41, 59);
          doc.text(item.component, 18, y + 4.5);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(item.primitive, 65, y + 4.5);
          doc.text(item.algorithmClass, 105, y + 4.5);

          if (item.riskLevel === 'Compliant') {
            doc.setTextColor(16, 149, 83);
          } else if (item.riskLevel === 'Moderate') {
            doc.setTextColor(217, 119, 6);
          } else {
            doc.setTextColor(225, 29, 72);
          }
          doc.setFont('helvetica', 'bold');
          doc.text(item.riskLevel.toUpperCase(), 145, y + 4.5);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(item.timelineTarget, pageWidth - 18, y + 4.5, { align: 'right' });

          y += 6.8;
        });

        y += 7.5;

        // 5. Satellite RF Layer & Host Self-Healing Boxes
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.text('5. SATELLITE RF PHYSICAL LAYER & HOST SELF-HEALING AUDIT', 14, y);

        y += 4.5;
        const colW = (pageWidth - 28 - 6) / 2;

        // Left Box
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, y, colW, 25, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text('SATCOM Physical Layer (Ku/Ka-Band)', 18, y + 5.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        doc.text('• Micro-Doppler Jitter: 0.014 rad (Nominal < 0.05 rad)', 18, y + 11);
        doc.text('• SDR RF Phase-Cancellation: ARMED (Zero packet drop)', 18, y + 16);
        doc.text('• Rogue Ground Station Detection: ZERO ANOMALIES', 18, y + 21);

        // Right Box
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14 + colW + 6, y, colW, 25, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text('Autonomous FIM Vault & Honeypot Trap', 14 + colW + 10, y + 5.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        doc.text('• Monitored Baselines: 38 mission-critical configs', 14 + colW + 10, y + 11);
        doc.text('• Self-Healing SLA: < 0.8s automated rollback', 14 + colW + 10, y + 16);
        doc.text('• Active Trap Port: 22222 (Auto-Banning active)', 14 + colW + 10, y + 21);

        // Page 1 Footer
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text('CONFIDENTIAL // AEGIS SENTINEL DEFENSIVE SYSTEM // FOR OFFICIAL OPERATIONS ONLY', 14, pageHeight - 7);
        doc.text('Page 1 of 2', pageWidth - 14, pageHeight - 7, { align: 'right' });

        // ---------------- PAGE 2 ----------------
        doc.addPage();

        // Page 2 Header Banner
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 18, 'F');
        doc.setFillColor(6, 182, 212);
        doc.rect(0, 18, pageWidth, 1, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.text('AEGIS SENTINEL // INCIDENT TELEMETRY & FORENSIC EVENT LOGS', 14, 11);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(`Generated: ${now.toISOString()}`, pageWidth - 14, 11, { align: 'right' });

        y = 25;

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.text('6. VERIFIED INCIDENT & SECURITY TELEMETRY LOGS', 14, y);

        y += 4.5;
        doc.setFillColor(30, 41, 59);
        doc.rect(14, y, pageWidth - 28, 6, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text('EVENT ID', 17, y + 4.2);
        doc.text('TIME', 36, y + 4.2);
        doc.text('SEVERITY', 52, y + 4.2);
        doc.text('SOURCE', 72, y + 4.2);
        doc.text('INCIDENT SUMMARY & ACTIONS TAKEN', 105, y + 4.2);

        y += 6;

        events.forEach((evt, idx) => {
          const rowH = 12.5;
          doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
          doc.rect(14, y, pageWidth - 28, rowH, 'F');
          doc.setDrawColor(226, 232, 240);
          doc.line(14, y + rowH, pageWidth - 14, y + rowH);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(30, 41, 59);
          doc.text(evt.id, 17, y + 4.5);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(evt.timestamp, 36, y + 4.5);

          if (evt.severity === 'nominal') {
            doc.setTextColor(16, 149, 83);
          } else if (evt.severity === 'warning') {
            doc.setTextColor(217, 119, 6);
          } else {
            doc.setTextColor(225, 29, 72);
          }
          doc.setFont('helvetica', 'bold');
          doc.text(evt.severity.toUpperCase(), 52, y + 4.5);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(evt.source, 72, y + 4.5);

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          const summaryTrim = doc.splitTextToSize(evt.summary, pageWidth - 120);
          doc.text(summaryTrim[0] || evt.summary, 105, y + 4.5);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          const targetInfo = `Target: ${evt.target} ${evt.mitreRef ? `[${evt.mitreRef}]` : ''}`;
          doc.text(targetInfo, 105, y + 8.5);

          y += rowH;
        });

        y += 7.5;

        // 7. Recommendations
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.text('7. BLUE TEAM IMMEDIATE RECOMMENDATIONS', 14, y);

        y += 4.5;

        const recommendations = [
          { priority: 'P1 - URGENT', rec: 'Investigate Event EVT-8937 (Kerberos TGS RC4 request). Enforce AES-256 for all service principal accounts to eliminate offline cracking vulnerabilities.' },
          { priority: 'P2 - HIGH', rec: 'Execute phase-out for VSAT boot signer RSA-2048 key. Upgrade bootloader validation logic to ML-DSA-65 (Dilithium) in accordance with NIST guidance.' },
          { priority: 'P3 - MEDIUM', rec: 'Verify Ku-band transponder secondary carrier attenuation. Maintain continuous micro-Doppler spectrum recording for satellite uplink.' },
        ];

        recommendations.forEach((r) => {
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(14, y, pageWidth - 28, 11, 1.5, 1.5, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(r.priority.startsWith('P1') ? 225 : (r.priority.startsWith('P2') ? 217 : 30), r.priority.startsWith('P1') ? 29 : (r.priority.startsWith('P2') ? 119 : 41), r.priority.startsWith('P1') ? 72 : (r.priority.startsWith('P2') ? 6 : 59));
          doc.text(r.priority, 18, y + 4.5);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.8);
          doc.setTextColor(51, 65, 85);
          doc.text(r.rec, 18, y + 8.5);

          y += 13;
        });

        y += 4;

        // Digital Forensic Verification Seal
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, y, pageWidth - 28, 17, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text('DIGITAL VERIFICATION & FORENSIC ATTESTATION', 18, y + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Digital Signature: SHA256-${Date.now().toString(16).toUpperCase()}9F8A7B6C5D4E3F2A1098B`, 18, y + 9.5);
        doc.text('Certified by AEGIS Omega Defensive Systems Framework. Zero tampering detected.', 18, y + 13.5);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 149, 83);
        doc.text('STATUS: VERIFIED SECURE', pageWidth - 20, y + 11, { align: 'right' });

        // Page 2 Footer
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text('CONFIDENTIAL // AEGIS SENTINEL DEFENSIVE SYSTEM // FOR OFFICIAL OPERATIONS ONLY', 14, pageHeight - 7);
        doc.text('Page 2 of 2', pageWidth - 14, pageHeight - 7, { align: 'right' });

        const filename = `AEGIS_Executive_Security_Report_${now.toISOString().slice(0, 10)}.pdf`;
        doc.save(filename);
        setPdfSuccessMessage(`Executive PDF report "${filename}" downloaded successfully.`);
        setTimeout(() => setPdfSuccessMessage(null), 6000);
      } catch (err) {
        console.error('Failed to generate PDF:', err);
        alert('Could not generate PDF report. Please check browser console.');
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 350);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased">
      {/* ==================================================================== */}
      {/* Responsive Sidebar Navigation                                       */}
      {/* ==================================================================== */}

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Wordmark & Lab Identity */}
          <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-white block">
                  AEGIS SENTINEL
                </span>
                <span className="text-[11px] text-slate-400 block -mt-0.5 font-medium">
                  Cyber Defense Lab Console
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-md md:hidden hover:bg-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <div className="px-3 pb-2 pt-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Security Operations
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveTab('overview');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 shrink-0" />
                <span>Executive Overview</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('telemetry');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'telemetry'
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Radio className="w-4 h-4 shrink-0" />
                <span>Threat Telemetry</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-900">
                {events.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('sbom');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'sbom'
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>PQC & Crypto SBOM</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/40">
                94.2%
              </span>
            </button>

            <div className="pt-5 px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Research & Engineering
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveTab('detection');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'detection'
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 shrink-0" />
                <span>MITRE Detection Rules</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-900">
                3
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('newsletter');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'newsletter'
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Newspaper className="w-4 h-4 shrink-0" />
                <span>Lab Findings Bulletin</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-semibold uppercase">
                Draft
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer / Node Info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400">Node Status</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online & Armed</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-mono space-y-0.5">
            <div>Station: AEGIS-STATION-04</div>
            <div>Crypto Engine: ML-KEM-768</div>
          </div>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* Main Content Area                                                   */}
      {/* ==================================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract (Zone 1: Breadcrumbs, Zone 2: Navigation controls, Zone 3: Actions) */}
        <header className="h-16 px-4 md:px-8 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Hamburger on mobile */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-slate-400 hover:text-white rounded-lg md:hidden hover:bg-slate-900"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Trail */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 hidden sm:inline">AEGIS Lab</span>
              <span className="text-slate-400 hidden sm:inline">/</span>
              <span className="text-slate-400">Console</span>
              <span className="text-slate-400">/</span>
              <span className="text-white font-medium capitalize">
                {activeTab}
              </span>
            </div>
          </div>

          {/* Actions Zone */}
          <div className="flex items-center gap-3">
            {/* Time range selector */}
            <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              {(['1h', '24h', '7d'] as const).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Refresh Telemetry Stream"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            {/* Executive PDF Report Button */}
            <button
              type="button"
              onClick={handleDownloadExecutivePdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-100 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer disabled:opacity-50"
              title="Generate and Download Executive PDF Report"
            >
              <FileText className={`w-3.5 h-3.5 text-cyan-400 ${isGeneratingPdf ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">{isGeneratingPdf ? 'Compiling PDF...' : 'Executive PDF'}</span>
              <span className="sm:hidden">PDF</span>
            </button>

            {/* Export Audit Report Button */}
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export JSON</span>
              <span className="sm:hidden">JSON</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Welcome / Section Headline */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Defensive Telemetry & Cryptographic Audit
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time security telemetry, Post-Quantum migration tracking, and detection rule repository.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>NIST PQC Standards: FIPS 203 & 204 Active</span>
            </div>
          </div>

          {/* ================================================================== */}
          {/* Key Metrics Row using the reusable DashboardCard Component         */}
          {/* ================================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardCard
              title="PQC Readiness Score"
              value="94.2%"
              subtitle="NIST FIPS 203/204 compliance across 120 satellite endpoints."
              status="nominal"
              statusLabel="NIST Compliant"
              icon={KeyRound}
              trend={{ value: "+2.4%", isPositive: true, label: "vs prior quarter" }}
              action={{
                label: "View SBOM",
                onClick: () => setActiveTab('sbom'),
              }}
            >
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>ML-KEM-768 Migration</span>
                  <span className="font-mono text-emerald-400">113 / 120 Nodes</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: '94.2%' }} />
                </div>
              </div>
            </DashboardCard>

            <DashboardCard
              title="Perimeter Threat Defenses"
              value="1,248"
              subtitle="Unauthorized connection attempts blocked and logged by Honeypot trap."
              status="nominal"
              statusLabel="0 Breaches"
              icon={ShieldCheck}
              trend={{ value: "-14%", isPositive: true, label: "scan reduction" }}
              action={{
                label: "Logs",
                onClick: () => setActiveTab('telemetry'),
              }}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Active Honeypot: Port 22222</span>
                <span className="font-mono text-cyan-400">Auto-Banning</span>
              </div>
            </DashboardCard>

            <DashboardCard
              title="Host Integrity (FIM Vault)"
              value="100%"
              subtitle="Continuous SHA-256 validation across 38 mission-critical configs."
              status="nominal"
              statusLabel="Zero Drift"
              icon={HardDrive}
              trend={{ value: "0 drift", isPositive: true, label: "2s audit cycle" }}
              action={{
                label: "Inspect",
                onClick: () => {
                  alert('FIM Verification: All 38 monitored file baselines in /etc/satcom match pristine SHA-256 checksums.');
                },
              }}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Self-Healing Engine</span>
                <span className="font-mono text-emerald-400">Armed (&lt; 0.8s)</span>
              </div>
            </DashboardCard>

            <DashboardCard
              title="SIEM Correlation Queue"
              value="3 Signals"
              subtitle="High-fidelity behavioral patterns flagged for Blue Team verification."
              status="warning"
              statusLabel="Review Required"
              icon={ShieldAlert}
              trend={{ value: "1 Critical", isPositive: false, label: "needs review" }}
              action={{
                label: "Investigate",
                onClick: () => setActiveTab('detection'),
              }}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Top Detection</span>
                <span className="font-mono text-amber-300">RC4 Kerberoasting</span>
              </div>
            </DashboardCard>
          </div>

          {/* ================================================================== */}
          {/* Tab 1: Overview & Threat Telemetry View                           */}
          {/* ================================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Executive Security Status & PDF Report Card */}
              <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-cyan-950/40 border border-cyan-500/25 rounded-xl p-5 relative overflow-hidden backdrop-blur-sm shadow-lg shadow-black/30">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        Executive Compliance & Audit Engine
                      </span>
                      <span className="text-xs text-slate-400">Formal Briefing Ready</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Executive Security Status & Forensic Audit Report (PDF)
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Generate and download an official, vector-quality PDF report covering executive health posture (99.4% nominal), verified incident telemetry logs, NIST PQC (FIPS 203/204) readiness milestones, and Blue Team remediation priorities.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        A4 2-Page Formal Briefing
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-slate-300">
                        <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                        SHA-256 Digital Verification Seal
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-slate-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        NIST / CISA Standard Mapped
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadExecutivePdf}
                      disabled={isGeneratingPdf}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all shadow-md shadow-cyan-950/60 disabled:opacity-60 cursor-pointer"
                    >
                      <FileText className={`w-4 h-4 ${isGeneratingPdf ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingPdf ? 'Compiling Official PDF...' : 'Download Executive PDF Report'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPdfPreviewModal(true)}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span>Preview Structure</span>
                    </button>
                  </div>
                </div>

                {pdfSuccessMessage && (
                  <div className="mt-4 pt-3 border-t border-cyan-500/20 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{pdfSuccessMessage}</span>
                  </div>
                )}
              </div>

              {/* Telemetry Filter & Table Section */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-white">
                      Live Telemetry & Correlated Security Events
                    </h2>
                    <p className="text-xs text-slate-400">
                      Real-time telemetry stream from endpoint sensors, honeypots, and crypto monitors.
                    </p>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search events, sources, targets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-64"
                      />
                    </div>

                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
                      {(['all', 'nominal', 'warning', 'critical'] as const).map((sev) => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setSeverityFilter(sev)}
                          className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                            severityFilter === sev
                              ? 'bg-slate-800 text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Events Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-400 font-medium">
                        <th className="pb-3 px-3">Time</th>
                        <th className="pb-3 px-3">Severity</th>
                        <th className="pb-3 px-3">Source</th>
                        <th className="pb-3 px-3">Summary</th>
                        <th className="pb-3 px-3">Target</th>
                        <th className="pb-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {filteredEvents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            No telemetry events matching the current search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredEvents.map((evt) => (
                          <tr
                            key={evt.id}
                            className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                            onClick={() => setSelectedEvent(evt)}
                          >
                            <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                              {evt.timestamp}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                                  evt.severity === 'nominal'
                                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                                    : evt.severity === 'warning'
                                    ? 'bg-amber-950/40 text-amber-300 border border-amber-800/40'
                                    : 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
                                }`}
                              >
                                {evt.severity}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                              {evt.source}
                            </td>
                            <td className="py-3 px-3 text-slate-200 max-w-md truncate">
                              {evt.summary}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                              {evt.target}
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(evt);
                                }}
                                className="text-cyan-400 hover:text-cyan-300 text-[11px] font-medium"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Security Architecture & Quick References */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-white">
                      Satellite (VSAT) RF Physical Layer Defense
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Under CISA and NSA satellite security baselines, uplink feeds are evaluated for micro-Doppler jitter and anomalous beam phase transitions. Any deviation exceeding 0.05 rad triggers automated SDR (Software Defined Radio) carrier phase-cancellation, preventing ground-station signal injection.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Active Carrier Verification</span>
                    <span className="text-emerald-400 font-mono font-medium">Verified (0.014 rad baseline)</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">
                      Autonomous Self-Healing FIM Protocol
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Monitored critical system configurations are protected via immutable baseline snapshots. If unauthorized modification or tampering occurs, the integrity daemon restores the pristine copy from the secure vault in under 800 milliseconds and logs the triggering process PID.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Restoration Sla</span>
                    <span className="text-emerald-400 font-mono font-medium">&lt; 0.8s Automated Rollback</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* Tab 2: Threat Telemetry Direct View                               */}
          {/* ================================================================== */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              {/* 7-Day Critical Security Alerts Trend Analysis (Recharts) */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 backdrop-blur-sm shadow-md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/40 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-rose-400" />
                        7-Day Security Telemetry Trend
                      </span>
                      <span className="text-xs text-slate-400">Recharts Analytic Engine</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-1">
                      Critical Security Alerts & Incident Frequency
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Daily incident frequency showing high-severity intrusion probes, Kerberoasting attempts, and automated self-healing containment rates.
                    </p>
                  </div>

                  {/* Trend Filter Tabs & Interactive Probe Simulator */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setTrendView('critical')}
                        className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                          trendView === 'critical'
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Critical Focus
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrendView('comparison')}
                        className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                          trendView === 'comparison'
                            ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/50'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Critical vs Mitigated
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrendView('all')}
                        className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                          trendView === 'all'
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Full Spectrum
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleSimulateCriticalProbe}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-200 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition-colors cursor-pointer"
                      title="Simulate Inbound Critical Alert Probe to Test Real-Time Recharts Update"
                    >
                      <Zap className="w-3.5 h-3.5 text-rose-400" />
                      <span>Simulate Critical Probe</span>
                    </button>
                  </div>
                </div>

                {/* 4 Summary Trend Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                      7-Day Critical Total
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold font-mono text-rose-400">
                        {alertTrendData.reduce((acc, curr) => acc + curr.criticalAlerts, 0)}
                      </span>
                      <span className="text-[11px] text-rose-400/80 font-mono">Alerts</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Daily avg: {(alertTrendData.reduce((acc, curr) => acc + curr.criticalAlerts, 0) / 7).toFixed(1)}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                      Auto-Mitigation Rate
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold font-mono text-emerald-400">
                        {(
                          (alertTrendData.reduce((acc, curr) => acc + curr.mitigated, 0) /
                            alertTrendData.reduce((acc, curr) => acc + curr.criticalAlerts, 0)) *
                          100
                        ).toFixed(1)}%
                      </span>
                      <span className="text-[11px] text-emerald-400/80 font-mono">SLA &lt;0.8s</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {alertTrendData.reduce((acc, curr) => acc + curr.mitigated, 0)} contained
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                      Peak Spike Day
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold font-mono text-amber-300">
                        Sep 21
                      </span>
                      <span className="text-[11px] text-amber-400/80 font-mono">11 alerts</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Kerberos RC4 + RF Jitter
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                      Scans Quarantined
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold font-mono text-cyan-400">
                        {alertTrendData.reduce((acc, curr) => acc + curr.scansBlocked, 0)}
                      </span>
                      <span className="text-[11px] text-cyan-400/80 font-mono">Probes</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Port 22222 Trap
                    </span>
                  </div>
                </div>

                {/* Recharts Area Container */}
                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={alertTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="criticalGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="mitigatedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="warningGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                      <XAxis
                        dataKey="day"
                        stroke="#94a3b8"
                        tickLine={false}
                        fontSize={11}
                        dy={6}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        tickLine={false}
                        allowDecimals={false}
                        fontSize={11}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as AlertTrendPoint;
                            return (
                              <div className="bg-slate-950/95 border border-slate-700 p-3.5 rounded-lg shadow-xl text-xs space-y-2 backdrop-blur-md min-w-[210px]">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                  <span className="font-bold text-white">{data.day}</span>
                                  <span className="font-mono text-[10px] text-slate-400">{data.fullDate}</span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                                      Critical Alerts:
                                    </span>
                                    <span className="font-mono font-bold text-rose-300">{data.criticalAlerts}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                      Auto-Mitigated:
                                    </span>
                                    <span className="font-mono font-bold text-emerald-300">{data.mitigated}</span>
                                  </div>
                                  {trendView === 'all' && (
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                                        Warnings:
                                      </span>
                                      <span className="font-mono font-bold text-amber-300">{data.warnings}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="flex items-center gap-1.5 text-slate-400">
                                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                                      Blocked Scans:
                                    </span>
                                    <span className="font-mono text-slate-300">{data.scansBlocked}</span>
                                  </div>
                                </div>
                                {data.peakVector && (
                                  <div className="mt-1 pt-1.5 border-t border-slate-800/80 text-[11px] text-slate-400 leading-tight">
                                    <span className="text-cyan-400 font-medium">Vector: </span>
                                    {data.peakVector}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />

                      {/* Render areas based on filter */}
                      {trendView === 'all' && (
                        <Area
                          type="monotone"
                          dataKey="warnings"
                          name="System Warnings"
                          stroke="#f59e0b"
                          strokeWidth={1.5}
                          fillOpacity={1}
                          fill="url(#warningGrad)"
                        />
                      )}

                      {(trendView === 'comparison' || trendView === 'all') && (
                        <Area
                          type="monotone"
                          dataKey="mitigated"
                          name="Auto-Mitigated (FIM & SDR)"
                          stroke="#10b981"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          fillOpacity={1}
                          fill="url(#mitigatedGrad)"
                        />
                      )}

                      <Area
                        type="monotone"
                        dataKey="criticalAlerts"
                        name="Critical Security Alerts"
                        stroke="#f43f5e"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#criticalGrad)"
                        activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Analytical Insight Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span>
                      Correlated finding: Peak anomaly on <strong className="text-slate-200 font-mono">Sep 21 (11 Critical Alerts)</strong> was neutralized by automated SDR phase cancellation and honeypot isolation with zero unauthorized privilege escalation.
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-cyan-400 shrink-0">
                    SLA: 99.9% Autonomous Uptime
                  </span>
                </div>
              </div>

              {/* Full Sensor Event Log */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                <h2 className="text-base font-semibold text-white mb-2">
                  Full Sensor Event Log
                </h2>
                <p className="text-xs text-slate-400 mb-4">
                  Granular event telemetry including cryptographic negotiations, honeypot traps, and RF signal monitoring.
                </p>

                <div className="space-y-3">
                  {events.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-4 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              evt.severity === 'nominal'
                                ? 'bg-emerald-400'
                                : evt.severity === 'warning'
                                ? 'bg-amber-400'
                                : 'bg-rose-400'
                            }`}
                          />
                          <span className="font-mono text-xs font-semibold text-white">
                            {evt.id}
                          </span>
                          <span className="text-slate-500">·</span>
                          <span className="text-xs font-medium text-slate-300">
                            {evt.source}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="font-mono">{evt.timestamp}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[11px]">
                            {evt.category}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-200 font-medium">
                        {evt.summary}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {evt.details}
                      </p>

                      <div className="mt-3 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="font-mono text-slate-400">
                          Target: {evt.target}
                        </span>
                        {evt.mitreRef && (
                          <span className="text-cyan-400 font-medium">
                            MITRE Reference: {evt.mitreRef}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* Tab 3: Cryptographic SBOM & Post-Quantum Compliance               */}
          {/* ================================================================== */}
          {activeTab === 'sbom' && (
            <div className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-white">
                      Cryptographic Software Bill of Materials (CBOM)
                    </h2>
                    <p className="text-xs text-slate-400">
                      Tracking cryptographic algorithms against upcoming NIST Post-Quantum standards (FIPS 203/204).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const cyclonedx = {
                        bomFormat: 'CycloneDX',
                        specVersion: '1.4',
                        version: 1,
                        metadata: {
                          timestamp: new Date().toISOString(),
                          component: { name: 'Aegis Sentinel Suite', version: '2.6.0' },
                        },
                        components: cryptoInventory.map((item) => ({
                          name: item.component,
                          version: item.version,
                          properties: [
                            { name: 'crypto:primitive', value: item.primitive },
                            { name: 'crypto:risk', value: item.riskLevel },
                            { name: 'crypto:target', value: item.timelineTarget },
                          ],
                        })),
                      };
                      handleCopy(JSON.stringify(cyclonedx, null, 2), 'cyclonedx');
                      alert('CycloneDX CBOM JSON copied to clipboard!');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy CycloneDX JSON</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-400 font-medium">
                        <th className="pb-3 px-3">Component</th>
                        <th className="pb-3 px-3">Active Primitive</th>
                        <th className="pb-3 px-3">Classification</th>
                        <th className="pb-3 px-3">Risk Status</th>
                        <th className="pb-3 px-3">Target Deadline</th>
                        <th className="pb-3 px-3">Remediation Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {cryptoInventory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-medium text-white">{item.component}</div>
                            <div className="text-[11px] font-mono text-slate-400">v{item.version}</div>
                          </td>
                          <td className="py-3 px-3 font-mono font-medium text-cyan-300 whitespace-nowrap">
                            {item.primitive}
                          </td>
                          <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                            {item.algorithmClass}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                                item.riskLevel === 'Compliant'
                                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                                  : 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
                              }`}
                            >
                              {item.riskLevel}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {item.timelineTarget}
                          </td>
                          <td className="py-3 px-3 text-slate-300 max-w-sm">
                            {item.recommendedAction}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* Tab 4: MITRE ATT&CK Detection Engineering Rules                    */}
          {/* ================================================================== */}
          {activeTab === 'detection' && (
            <div className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-white">
                    Defensive Detection Engineering (MITRE ATT&CK Mappings)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Defensive SIEM correlation and telemetry rules engineered for lab research publications and SOC operations.
                  </p>
                </div>

                <div className="space-y-4">
                  {detectionRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-cyan-950/50 text-cyan-300 border border-cyan-800/40">
                              {rule.mitreId}
                            </span>
                            <h3 className="text-sm font-semibold text-white">
                              {rule.title}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            Technique: <span className="text-slate-300 font-medium">{rule.technique}</span> · Primary Telemetry: <span className="font-mono text-slate-300">{rule.targetLog}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                              rule.severity === 'Critical'
                                ? 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
                                : 'bg-amber-950/40 text-amber-300 border border-amber-800/40'
                            }`}
                          >
                            {rule.severity} Priority
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {rule.logicSummary}
                      </p>

                      {/* Sigma Rule Code Block */}
                      <div className="relative mt-2">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-t-lg text-[11px] text-slate-400">
                          <span>Sigma Detection Signature</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(rule.sigmaSnippet, rule.id)}
                            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
                          >
                            {copiedKey === rule.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Rule</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-3 bg-slate-950 border-x border-b border-slate-800 rounded-b-lg font-mono text-xs text-slate-300 overflow-x-auto">
                          {rule.sigmaSnippet}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* Tab 5: Cybersecurity Lab Research Findings & Newsletter Draft      */}
          {/* ================================================================== */}
          {activeTab === 'newsletter' && (
            <div className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block mb-1">
                      Cybersecurity Lab Bulletin Draft
                    </span>
                    <h2 className="text-xl font-bold text-white">
                      {newsletterDraft.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {newsletterDraft.author} · {newsletterDraft.date}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const fullMarkdown = `# ${newsletterDraft.title}\n**${newsletterDraft.author}** | ${newsletterDraft.date}\n\n` +
                          newsletterDraft.sections.map((s) => `## ${s.heading}\n\n${s.body}`).join('\n\n');
                        handleCopy(fullMarkdown, 'newsletter-md');
                        alert('Full Newsletter Markdown copied to clipboard!');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Markdown</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-6 pt-6">
                  {newsletterDraft.sections.map((sec, idx) => (
                    <div key={idx} className="space-y-2">
                      <h3 className="text-sm font-semibold text-cyan-300">
                        {sec.heading}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {sec.body}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Newsletter References and Defense Checklists */}
                <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80">
                    <h4 className="font-semibold text-white mb-1">Key Action Items for Lab Subscribers</h4>
                    <ul className="list-disc list-inside text-slate-400 space-y-1 text-[11px]">
                      <li>Deploy hybrid ML-KEM/X25519 for all TLS 1.3 edge termination gateways.</li>
                      <li>Audit Active Directory Event ID 4769 for RC4 encryption downgrade abuse.</li>
                      <li>Implement out-of-band automated configuration integrity baselines.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80">
                    <h4 className="font-semibold text-white mb-1">Audited Compliance Standards</h4>
                    <div className="text-slate-400 text-[11px] space-y-1">
                      <div>· NIST FIPS 203 (ML-KEM Key Encapsulation)</div>
                      <div>· NIST FIPS 204 (ML-DSA Digital Signatures)</div>
                      <div>· NSA Commercial National Security Algorithm Suite 2.0 (CNSA 2.0)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* Event Details Inspection Modal                                       */}
      {/* ==================================================================== */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono text-cyan-400">
                  {selectedEvent.id}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedEvent.summary}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="font-mono text-white">{selectedEvent.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sensor Source:</span>
                <span className="font-mono text-cyan-300">{selectedEvent.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Resource:</span>
                <span className="font-mono text-slate-200">{selectedEvent.target}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Severity:</span>
                <span className="capitalize font-medium text-emerald-400">{selectedEvent.severity}</span>
              </div>
              {selectedEvent.mitreRef && (
                <div className="flex justify-between">
                  <span className="text-slate-400">MITRE ATT&CK:</span>
                  <span className="text-amber-300 font-medium">{selectedEvent.mitreRef}</span>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-white block mb-1">Diagnostic Detail:</span>
              {selectedEvent.details}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Close Diagnostic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Executive PDF Report Structure Preview Modal */}
      {showPdfPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Executive Security Status & Forensic Audit Report Preview
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Document Specification: A4 2-Page Official Briefing (vector PDF)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPdfPreviewModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-slate-300 font-semibold">
                  <span className="text-cyan-400">Section 1: Executive Posture Assessment</span>
                  <span className="text-[10px] font-mono text-emerald-400">Page 1</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Summarizes enterprise security health (99.4% stability, 0 confirmed breaches), zero-trust enforcement status, and automated honeypot trap defense efficiency.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-slate-300 font-semibold">
                  <span className="text-cyan-400">Section 2: Core Security Metrics & KPIs</span>
                  <span className="text-[10px] font-mono text-emerald-400">Page 1</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Includes PQC readiness score (94.2%), 1,248 perimeter threat intercepts, 100% host integrity baseline validation, and active correlation signals.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-slate-300 font-semibold">
                  <span className="text-cyan-400">Section 3: 7-Day Critical Incident Trend Summary</span>
                  <span className="text-[10px] font-mono text-emerald-400">Page 1</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Breakdown of 40 total critical alerts over 7 days, 97.5% automated containment rate, peak incident on Sep 21, and mean containment time of 0.78 seconds.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-slate-300 font-semibold">
                  <span className="text-cyan-400">Section 4 & 5: NIST PQC Inventory & Satellite RF Physical Layer</span>
                  <span className="text-[10px] font-mono text-emerald-400">Page 1</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Comprehensive audit of cryptographic primitives (FIPS 203 ML-KEM, FIPS 204 ML-DSA, legacy RSA-2048 phase-out) and Ku/Ka-band micro-Doppler RF telemetry.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-slate-300 font-semibold">
                  <span className="text-cyan-400">Section 6 & 7: Verified Telemetry Logs & Recommendations</span>
                  <span className="text-[10px] font-mono text-cyan-400">Page 2</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Chronological incident event table with severity, source, target, forensic details, prioritized Blue Team action items, and cryptographic attestation seal.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 font-mono">
                File: AEGIS_Executive_Security_Report_{new Date().toISOString().slice(0, 10)}.pdf
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPdfPreviewModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPdfPreviewModal(false);
                    handleDownloadExecutivePdf();
                  }}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Generate & Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
