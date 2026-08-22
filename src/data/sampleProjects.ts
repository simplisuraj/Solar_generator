import { IngestedFile } from '../types';

export interface SampleProject {
  id: string;
  name: string;
  category: string;
  capacity: string;
  stage: string;
  description: string;
  files: IngestedFile[];
}

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: 'hg_badu_kusum',
    name: 'HG Solar Energy (Badu) Pvt Ltd — 2.5 MW KUSUM Component-C',
    category: 'Solar PV / PM-KUSUM C',
    capacity: '2.50 MW AC / 3.25 MWp DC',
    stage: 'Commissioned (Reimbursement Case)',
    description: 'Grid-connected feeder-level solar project in Badu, Nagaur (Rajasthan) under PM-KUSUM Component-C with JVVNL 25-yr PPA.',
    files: [
      {
        name: '01_Executed_PPA_JVVNL_HG_Badu.pdf',
        type: 'application/pdf',
        size: 245000,
        parserMethod: 'PDF parser + OCR fallback',
        uploadedAt: new Date().toISOString(),
        charCount: 3850,
        pageCount: 3,
        text: `[PDF page 1]
POWER PURCHASE AGREEMENT (PPA)
Between JAIPUR VIDYUT VITRAN NIGAM LIMITED (JVVNL / Power Procurer) and HG SOLAR ENERGY (BADU) PRIVATE LIMITED (Solar Power Generator / SPG).
Project Scheme: PM-KUSUM Scheme Component-C (Feeder Level Solarisation).
Contracted AC Capacity: 2.50 MW AC.
Installed DC Capacity: 3.25 MWp DC.
PPA Execution Date: 12th October 2023.
Tenure: 25 (Twenty-Five) years from Commercial Operation Date (COD).

[PDF page 2]
ARTICLE 5: TARIFF AND PAYMENT TERMS
5.1 Tariff: JVVNL agrees to pay fixed tariff of INR 3.14 per kWh (Three Rupees and Fourteen Paise only) for all net delivered energy measured at the Interconnection Point.
5.2 Delivery Point: 33/11 kV Badu Substation (GSS), District Nagaur, Rajasthan at 11 kV bus.
5.3 Payment Due Date: 30 days from the date of submission of undisputed monthly energy bill.
5.4 Letter of Credit (LC): Procurer shall establish an unconditional, revolving Letter of Credit for an amount equal to 1.05 times 1 month estimated billing.

[PDF page 3]
ARTICLE 9: PROJECT LOCATION & COMMISSIONING
Plant Feeder: 11 kV Badu Feeder originating from 33/11 kV GSS Badu.
Location: Khasra Nos. 142/1, 142/2, 143, Village Badu, Tehsil Parbatsar, District Nagaur, Rajasthan.
Must-Run Status: The Solar Power Plant shall be treated as a MUST-RUN facility and shall not be subjected to merit order dispatch curtailment except for grid security.
Assignment: Power Generator is permitted to assign rights under this PPA to Lenders / Lead Financing Institution as security.`
      },
      {
        name: '02_LOA_and_Sanction_JVVNL.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 112000,
        parserMethod: 'DOCX parser',
        uploadedAt: new Date().toISOString(),
        charCount: 2240,
        pageCount: 1,
        text: `[DOCX P0] LETTER OF AWARD (LOA)
[DOCX P1] Ref No: JVVNL/SE(KUSUM)/TN-08/LOA-118/2023-24 Date: 14th August 2023
[DOCX P2] Issued by: Jaipur Vidyut Vitran Nigam Limited (JVVNL), Vidyut Bhawan, Jaipur.
[DOCX P3] Awarded to: H.G. Infra Engineering Limited (Lead Member) in Consortium for SPV HG Solar Energy (Badu) Private Limited.
[DOCX P4] Scope: Design, Engineering, Procurement, Construction, Testing and Commissioning with 25 years O&M of 2.50 MW Solar PV Plant at Badu GSS under KUSUM-C RESCO Mode.
[DOCX T0 R0] Parameter || Value
[DOCX T0 R1] LOA Tariff || INR 3.14 / kWh
[DOCX T0 R2] Minimum CUF Guaranteed || 19.00%
[DOCX T0 R3] Scheduled COD Deadline || 9 months from LOA Date
[DOCX T0 R4] PBG Furnished || INR 25,00,000 (Twenty Five Lakhs only)`
      },
      {
        name: '03_COD_and_CEIG_Certificate.pdf',
        type: 'application/pdf',
        size: 184000,
        parserMethod: 'PDF parser + OCR fallback',
        uploadedAt: new Date().toISOString(),
        charCount: 1650,
        pageCount: 1,
        text: `[PDF page 1]
COMMISSIONING CERTIFICATE / SYNCHRONIZATION CERTIFICATE
Issued by: Superintending Engineer (RE & KUSUM), JVVNL, Nagaur Circle.
Date of Issue: 28th March 2024.
Certified that 2.50 MW (AC) / 3.25 MWp (DC) Solar PV Power Plant of M/s HG Solar Energy (Badu) Private Limited situated at Village Badu, Tehsil Parbatsar, Dist Nagaur has been successfully synchronized with the 33/11 kV Badu Substation on 26th March 2024 at 15:45 Hours.
Full Commercial Operation Date (COD) achieved: 28th March 2024.
CEIG Approval Reference: CEIG/RAJ/JPR/2024/EL-9442 dated 22nd March 2024.`
      },
      {
        name: '04_CA_Project_Cost_and_Utilisation_Certificate.pdf',
        type: 'application/pdf',
        size: 142000,
        parserMethod: 'PDF parser + OCR fallback',
        uploadedAt: new Date().toISOString(),
        charCount: 2890,
        pageCount: 2,
        text: `[PDF page 1]
CHARTERED ACCOUNTANT CERTIFICATE — PROJECT COST & MEANS OF FINANCE
UDIN: 24419822BKLEPX8819
Name of SPV: HG Solar Energy (Badu) Private Limited (CIN: U40106RJ2023PTC088219)
Registered Address: III Floor, HG House, Plot No. 1, Gopalpura Bypass, Jaipur - 302018, Rajasthan.
PAN: AAFCH8819K | GSTIN: 08AAFCH8819K1ZR

[PDF page 2]
PROJECT COST BREAKDOWN (INR Lakhs):
1. EPC Contract & Plant Machinery: INR 880.00 Lakhs
2. Land Lease & Site Development: INR 35.00 Lakhs
3. Evacuation Line & Transformer: INR 28.00 Lakhs
4. Preliminary & Pre-operative Expenses: INR 12.00 Lakhs
5. Interest During Construction (IDC): INR 5.00 Lakhs
TOTAL PROJECT COST: INR 960.00 Lakhs (INR 9.60 Crores)

MEANS OF FINANCE (PROPOSED / INCURRED):
1. Proposed Term Loan from Bank: INR 720.00 Lakhs (INR 7.20 Crores - 75.0%)
2. Equity / Promoter Contribution by H.G. Infra: INR 240.00 Lakhs (INR 2.40 Crores - 25.0%)
Debt-Equity Ratio: 3.00:1 (75:25)
Promoter Margin: 25.00%
Actual Incurred CAPEX as on 31-March-2024: INR 945.50 Lakhs through Sponsor bridge funding; eligible reimbursement term loan request of INR 720.00 Lakhs.`
      },
      {
        name: '05_PVSyst_and_Technical_Report.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 198000,
        parserMethod: 'DOCX parser',
        uploadedAt: new Date().toISOString(),
        charCount: 2980,
        pageCount: 1,
        text: `[DOCX P0] PVSYST V7.4 & TECHNICAL SPECIFICATION SUMMARY REPORT
[DOCX P1] Project: Badu 2.5 MW Solar PV Plant
[DOCX T0 R0] Technical Parameter || Value
[DOCX T0 R1] PV Module Make & Model || Waaree Energies Mono PERC 545 Wp Bifacial
[DOCX T0 R2] Total Modules Installed || 5,964 Modules (3.250 MWp)
[DOCX T0 R3] Inverter Make & Model || Sungrow SG250HX (250 kVA)
[DOCX T0 R4] Inverter Quantity || 10 Units (Total 2,500 kVA AC)
[DOCX T0 R5] Transformer Rating || 1 x 3.0 MVA, 0.8/11 kV Step-up
[DOCX T0 R6] DC/AC Overloading Ratio || 1.30
[DOCX T0 R7] P90 Annual Generation Year-1 || 4,280.00 MWh
[DOCX T0 R8] P50 Annual Generation Year-1 || 4,610.00 MWh
[DOCX T0 R9] P90 CUF (Year 1) || 19.54%
[DOCX T0 R10] Year 1 Degradation || 1.50%
[DOCX T0 R11] Annual Degradation Year 2-25 || 0.55% per annum`
      },
      {
        name: '06_Financial_Model_and_DSCR_Summary.json',
        type: 'application/json',
        size: 96000,
        parserMethod: 'JSON parser',
        uploadedAt: new Date().toISOString(),
        charCount: 2450,
        pageCount: 1,
        text: `{
  "financial_model_summary": {
    "spv_name": "HG Solar Energy (Badu) Private Limited",
    "project_cost_inr_cr": 9.60,
    "term_loan_inr_cr": 7.20,
    "equity_inr_cr": 2.40,
    "loan_tenor_months": 180,
    "moratorium_months": 6,
    "repayment_tenor_years": 15,
    "interest_rate_pct": 8.75,
    "p90_cuf_pct": 19.54,
    "first_year_revenue_inr_cr": 1.344,
    "first_year_ebitda_inr_cr": 1.226,
    "average_gross_dscr_p90": 1.28,
    "minimum_gross_dscr_p90": 1.21,
    "sensitivity_results": {
      "tariff_minus_5_pct_dscr": 1.21,
      "generation_minus_10_pct_dscr": 1.15,
      "om_plus_10_pct_dscr": 1.26,
      "interest_plus_2_pct_dscr": 1.18
    },
    "security_package": {
      "mortgage_leasehold": true,
      "hypothecation_plant_machinery": true,
      "assignment_ppa": true,
      "escrow_mechanism": true,
      "sponsor_corporate_guarantee": "H.G. Infra Engineering Limited",
      "dsra_requirement": "2 quarters debt service (INR 0.42 Cr)"
    }
  }
}`
      }
    ]
  },
  {
    id: 'bikaner_50mw_ground_mounted',
    name: 'Thar Green Power SPV — 50 MW Ground Mounted Solar Project',
    category: 'Utility Scale Solar',
    capacity: '50.00 MW AC / 70.00 MWp DC',
    stage: 'Under Construction',
    description: 'Utility-scale solar plant in Bikaner with SECI 25-year PPA @ ₹2.52/kWh and ISTS connectivity.',
    files: [
      {
        name: '01_SECI_PPA_Executed.pdf',
        type: 'application/pdf',
        size: 310000,
        parserMethod: 'PDF parser + OCR fallback',
        uploadedAt: new Date().toISOString(),
        charCount: 3120,
        pageCount: 1,
        text: `[PDF page 1]
POWER PURCHASE AGREEMENT (PPA)
Between SOLAR ENERGY CORPORATION OF INDIA LIMITED (SECI) and THAR GREEN POWER PRIVATE LIMITED.
Project Capacity: 50.00 MW AC (70.00 MWp DC).
Tariff: INR 2.52 per kWh for 25 years.
Location: Kolayat Tehsil, Bikaner District, Rajasthan.
Interconnection: 220 kV ISTS Bikaner-II Grid Substation.`
      },
      {
        name: '02_CA_Cost_and_Means_Certificate.pdf',
        type: 'application/pdf',
        size: 190000,
        parserMethod: 'PDF parser + OCR fallback',
        uploadedAt: new Date().toISOString(),
        charCount: 2150,
        pageCount: 1,
        text: `[PDF page 1]
PROJECT COST: Total INR 190.00 Crores (EPC: INR 172.00 Cr, Land: INR 10.00 Cr, Pre-op: INR 8.00 Cr).
MEANS OF FINANCE:
Term Loan Proposed: INR 140.00 Crores (73.68%).
Equity Contribution: INR 50.00 Crores (26.32%).
Debt Equity Ratio: 2.80:1. Door-to-door tenor: 216 months (18 years).`
      }
    ]
  }
];
