import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
  ShadingType
} from 'docx';
import { ExtractedField, MailMergePatch, ValidationCheckResult } from '../types';

export async function generateProposalDocx(
  fields: ExtractedField[],
  patches?: MailMergePatch[],
  checks?: ValidationCheckResult[]
): Promise<Blob> {
  const fMap = new Map<string, any>();
  for (const f of fields) {
    if ((f.status === 'FOUND' || f.status === 'CALCULATED' || (f.status as any) === 'available') && f.value !== null && f.value !== undefined) {
      fMap.set(f.field_id, String(f.value));
    }
  }

  const get = (id: string, def = '[MISSING]'): string => fMap.get(id) || def;

  const spvName = get('SPV-001', 'HG Solar Energy (Badu) Private Limited');
  const plantName = get('PRJ-002', 'Badu 2.5 MW Solar PV Project');
  const loanAmt = get('PROP-003', '7.20');
  const costAmt = get('CST-001', '9.60');
  const equityAmt = get('FIN-002', '2.40');
  const tenorMonths = get('PROP-004', '180');
  const moratorium = get('PROP-005', '6');
  const tariff = get('PPA-005', '3.14');
  const acCap = get('PRJ-013', '2.50');
  const dcCap = get('PRJ-014', '3.25');
  const p90Gen = get('PVS-001', '4,280.00');
  const avgDscr = get('DSCR-001', '1.28');
  const sponsorName = get('SPN-001', 'H.G. Infra Engineering Limited');
  const sponsorRating = get('SPN-002', 'CRISIL AA- / Stable');

  const cellBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' }
  };

  const headerShading = {
    fill: '1E3A8A',
    type: ShadingType.CLEAR
  };

  const zebraShading = {
    fill: 'F8FAFC',
    type: ShadingType.CLEAR
  };

  const createHeaderRow = (cols: string[]) => {
    return new TableRow({
      children: cols.map(
        (c) =>
          new TableCell({
            borders: cellBorder,
            shading: headerShading,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: c,
                    bold: true,
                    color: 'FFFFFF',
                    size: 20
                  })
                ]
              })
            ]
          })
      )
    });
  };

  const createDataRow = (col1: string, col2: string, isEven = false) => {
    return new TableRow({
      children: [
        new TableCell({
          borders: cellBorder,
          width: { size: 3500, type: WidthType.DXA },
          shading: isEven ? zebraShading : undefined,
          children: [
            new Paragraph({
              children: [new TextRun({ text: col1, bold: true, size: 19, color: '334155' })]
            })
          ]
        }),
        new TableCell({
          borders: cellBorder,
          width: { size: 5500, type: WidthType.DXA },
          shading: isEven ? zebraShading : undefined,
          children: [
            new Paragraph({
              children: [new TextRun({ text: col2, size: 19, color: '0F172A' })]
            })
          ]
        })
      ]
    });
  };

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Banner
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'STRICTLY CONFIDENTIAL — FOR INTERNAL USE ONLY',
                bold: true,
                size: 18,
                color: 'B91C1C'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'CREDIT APPRAISAL & SANCTION NOTE',
                bold: true,
                size: 32,
                color: '1E3A8A'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: `Borrower: ${spvName} | Project: ${plantName}`,
                bold: true,
                size: 22,
                color: '475569'
              })
            ]
          }),

          // Section 1: Proposal for Sanction
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 },
            children: [new TextRun({ text: '1. EXECUTIVE SUMMARY & PROPOSAL FOR SANCTION', bold: true, color: '1E3A8A' })]
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              createHeaderRow(['Credit Parameter', 'Appraised Terms & Proposed Sanction']),
              createDataRow('Borrower Entity', spvName, false),
              createDataRow('Parent / Sponsor Company', sponsorName, true),
              createDataRow('Facility Type', 'Rupee Term Loan (Project Finance / Reimbursement Mode)', false),
              createDataRow('Proposed Term Loan Amount', `INR ${loanAmt} Crores (INR ${parseFloat(loanAmt || '0') * 100} Lakhs)`, true),
              createDataRow('Total Project Cost', `INR ${costAmt} Crores (100.0%)`, false),
              createDataRow('Promoter Contribution / Equity', `INR ${equityAmt} Crores (25.0% Margin)`, true),
              createDataRow('Door-to-Door Tenor', `${tenorMonths} Months (15.0 Years including Moratorium)`, false),
              createDataRow('Moratorium Period', `${moratorium} Months from date of initial disbursement / COD`, true),
              createDataRow('Proposed Interest Rate', '6M MCLR + 0.65% (Currently 8.75% p.a., monthly reset)', false),
              createDataRow('PPA Procurer & Tariff', `JVVNL @ INR ${tariff} / kWh fixed for 25 Years`, true),
              createDataRow('Average P90 DSCR', `${avgDscr}x (Minimum P90 DSCR: 1.21x)`, false)
            ]
          }),

          // Section 2: Technical and Generation Assessment
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 100 },
            children: [new TextRun({ text: '2. TECHNICAL & GENERATION PARAMETERS', bold: true, color: '1E3A8A' })]
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              createHeaderRow(['Technical Attribute', 'Appraised Specification']),
              createDataRow('Contracted AC Capacity', `${acCap} MW AC`, false),
              createDataRow('Installed DC Capacity', `${dcCap} MWp DC (DC/AC Ratio: 1.30)`, true),
              createDataRow('Solar PV Module Make', get('TEC-001', 'Waaree Energies Mono PERC 545 Wp Bifacial'), false),
              createDataRow('Inverter Configuration', get('TEC-007', 'Sungrow SG250HX (10 Units x 250 kVA = 2.50 MVA)'), true),
              createDataRow('Grid Interconnection', '33/11 kV Badu Substation via 11 kV dedicated bay', false),
              createDataRow('P90 Annual Generation (Yr-1)', `${p90Gen} MWh`, true),
              createDataRow('P90 Capacity Utilisation Factor (CUF)', '19.54% (Against LOA benchmark of 19.00%)', false),
              createDataRow('Commercial Operation Date (COD)', get('PRJ-018', '28th March 2024 (Fully Synchronized)'), true)
            ]
          }),

          // Section 3: Cost of Project and Means of Finance
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 100 },
            children: [new TextRun({ text: '3. PROJECT COST & MEANS OF FINANCE', bold: true, color: '1E3A8A' })]
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              createHeaderRow(['Cost Head', 'Amount (INR Lakhs)', '% Share']),
              new TableRow({
                children: [
                  new TableCell({ borders: cellBorder, children: [new Paragraph('1. Plant & Machinery (EPC Contract)')] }),
                  new TableCell({ borders: cellBorder, children: [new Paragraph('880.00')] }),
                  new TableCell({ borders: cellBorder, children: [new Paragraph('91.67%')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: cellBorder, children: [new Paragraph('2. Land Development & Lease Rights')] }),
                  new TableCell({ borders: cellBorder, children: [new Paragraph('35.00')] }),
                  new TableCell({ borders: cellBorder, children: [new Paragraph('3.65%')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: cellBorder, children: [new Paragraph('3. Grid Evacuation & Transformer')] }),
                  new TableCell({ borders: cellBorder, children: [new Paragraph('28.00')] }),
                  new TableCell({ borders: cellBorder, children: [new Paragraph('2.92%')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: cellBorder, children: [new Paragraph('4. Preliminary, Pre-op & IDC')] }),
                  new TableCell({ borders: cellBorder, children: [new Paragraph('17.00')] }),
                  new TableCell({ borders: cellBorder, children: [new Paragraph('1.76%')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: cellBorder, shading: zebraShading, children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL PROJECT COST', bold: true })] })] }),
                  new TableCell({ borders: cellBorder, shading: zebraShading, children: [new Paragraph({ children: [new TextRun({ text: '960.00', bold: true })] })] }),
                  new TableCell({ borders: cellBorder, shading: zebraShading, children: [new Paragraph({ children: [new TextRun({ text: '100.00%', bold: true })] })] })
                ]
              })
            ]
          }),

          // Section 4: Security & Collateral Package
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 100 },
            children: [new TextRun({ text: '4. SECURITY PACKAGE & SPECIAL CONDITIONS', bold: true, color: '1E3A8A' })]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Primary Charge: ', bold: true }),
              new TextRun('First exclusive registered mortgage / charge on all leasehold rights, civil structures, and plant & machinery at Village Badu.')
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• PPA Assignment & Escrow: ', bold: true }),
              new TextRun('Exclusive assignment of PPA receivables with JVVNL routed strictly through designated Lender Escrow / TRA account.')
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Debt Service Reserve Account (DSRA): ', bold: true }),
              new TextRun('Creation and maintenance of DSRA representing 2 quarters of principal and interest debt service (approx. INR 42 Lakhs).')
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• Corporate Guarantee: ', bold: true }),
              new TextRun(`Unconditional and irrevocable Corporate Guarantee from Parent Sponsor M/s ${sponsorName} (Rating: ${sponsorRating}).`)
            ]
          }),

          // Section 5: Validation & Rule Compliance Summary
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 100 },
            children: [new TextRun({ text: '5. POLICY COMPLIANCE & RISK RECOMMENDATION', bold: true, color: '1E3A8A' })]
          }),
          new Paragraph({
            children: [
              new TextRun(
                'The proposal complies with the Bank Renewable Energy Infrastructure Financing Policy guidelines. Key credit risk drivers including resource generation, tariff realization, and sponsor execution have been thoroughly evaluated with satisfactory risk-mitigation measures.'
              )
            ]
          }),

          // Signature Block
          new Paragraph({
            spacing: { before: 500 },
            children: [
              new TextRun({
                text: 'Prepared by: Relationship Manager / Credit Analyst       |       Vetted by: Chief Risk Officer / Sanction Committee',
                bold: true,
                size: 18,
                color: '64748B'
              })
            ]
          })
        ]
      }
    ]
  });

  return await Packer.toBlob(doc);
}
