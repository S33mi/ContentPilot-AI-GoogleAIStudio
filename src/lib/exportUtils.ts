import { jsPDF } from 'jspdf';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx';
import * as XLSX from 'xlsx';
import {
  SocialMediaPackResponse,
  ProductDescriptionResponse,
  CustomerReplyResponse,
} from '../types';

// Helper function to trigger browser download for Blobs
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helper to sanitize filename
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
}

// ==========================================
// 1. SOCIAL MEDIA PACK EXPORT
// ==========================================
export async function exportSocialPack(
  pack: SocialMediaPackResponse,
  businessName: string,
  format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'json'
) {
  const safeBusiness = sanitizeFilename(businessName || 'Business');
  const dateStr = new Date().toISOString().slice(0, 10);
  const baseFilename = `ContentPilot-Social-Pack-${safeBusiness}-${dateStr}`;

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(pack, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    downloadBlob(blob, `${baseFilename}.json`);
    return;
  }

  if (format === 'csv') {
    const headers = [
      'Day',
      'Day Title',
      'Post Type',
      'Hook / Theme',
      'Full Caption',
      'Hashtags',
      'Call to Action',
      'Visual Idea',
    ];
    const rows = pack.posts.map((p: any) => [
      `Day ${p.dayNumber}`,
      p.dayLabel || p.dayName || '',
      p.postType || '',
      p.theme || p.hook || '',
      p.caption || '',
      Array.isArray(p.hashtags) ? p.hashtags.join(' ') : p.hashtags || '',
      p.callToAction || '',
      p.visualIdea || '',
    ]);

    const csvContent =
      headers.join(',') +
      '\n' +
      rows
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        )
        .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    downloadBlob(blob, `${baseFilename}.csv`);
    return;
  }

  if (format === 'xlsx') {
    const excelData = pack.posts.map((p: any) => ({
      'Day Number': `Day ${p.dayNumber}`,
      'Day Label': p.dayLabel || p.dayName || '',
      'Post Type': p.postType || '',
      'Theme / Hook': p.theme || p.hook || '',
      Caption: p.caption || '',
      Hashtags: Array.isArray(p.hashtags) ? p.hashtags.join(' ') : p.hashtags || '',
      'Call to Action': p.callToAction || '',
      'Visual Idea': p.visualIdea || '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 10 },
      { wch: 18 },
      { wch: 22 },
      { wch: 30 },
      { wch: 55 },
      { wch: 25 },
      { wch: 25 },
      { wch: 35 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Social Content Pack');
    XLSX.writeFile(wb, `${baseFilename}.xlsx`);
    return;
  }

  if (format === 'pdf') {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = 18;
    const margin = 15;
    const pageWidth = 180;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(30, 41, 59);
    pdf.text('ContentPilot AI - Social Media Content Pack', margin, y);

    y += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      `Business: ${businessName || 'N/A'} | Strategy: ${pack.weeklyTheme || 'Weekly Strategy'} | Date: ${dateStr}`,
      margin,
      y
    );

    y += 8;
    pdf.setDrawColor(203, 213, 225);
    pdf.line(margin, y, margin + pageWidth, y);
    y += 8;

    pack.posts.forEach((p: any) => {
      if (y > 245) {
        pdf.addPage();
        y = 18;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(79, 70, 229);
      pdf.text(`Day ${p.dayNumber}: ${p.dayLabel || p.dayName || ''} [${p.postType}]`, margin, y);
      y += 6;

      const hookText = p.theme || p.hook;
      if (hookText) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(15, 23, 42);
        const hookLines = pdf.splitTextToSize(`Theme: ${hookText}`, pageWidth);
        pdf.text(hookLines, margin, y);
        y += hookLines.length * 5;
      }

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(51, 65, 85);

      const captionLines = pdf.splitTextToSize(`Caption:\n${p.caption}`, pageWidth);
      pdf.text(captionLines, margin, y);
      y += captionLines.length * 4.8;

      if (p.hashtags) {
        const tagText = Array.isArray(p.hashtags) ? p.hashtags.join(' ') : p.hashtags;
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(2, 132, 199);
        const tagLines = pdf.splitTextToSize(`Hashtags: ${tagText}`, pageWidth);
        pdf.text(tagLines, margin, y);
        y += tagLines.length * 4.8;
      }

      if (p.callToAction) {
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(15, 23, 42);
        const ctaLines = pdf.splitTextToSize(`CTA: ${p.callToAction}`, pageWidth);
        pdf.text(ctaLines, margin, y);
        y += ctaLines.length * 4.8;
      }

      if (p.visualIdea) {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        const visualLines = pdf.splitTextToSize(`Visual Idea: ${p.visualIdea}`, pageWidth);
        pdf.text(visualLines, margin, y);
        y += visualLines.length * 4.8;
      }

      y += 4;
      pdf.setDrawColor(241, 245, 249);
      pdf.line(margin, y, margin + pageWidth, y);
      y += 6;
    });

    pdf.save(`${baseFilename}.pdf`);
    return;
  }

  if (format === 'docx') {
    const paragraphs: Paragraph[] = [
      new Paragraph({
        text: `ContentPilot AI - Social Media Content Pack`,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Business: ${businessName || 'N/A'} | Strategy: ${pack.weeklyTheme || ''} | Date: ${dateStr}`,
            italics: true,
            color: '64748B',
          }),
        ],
        spacing: { after: 240 },
      }),
    ];

    pack.posts.forEach((p: any) => {
      paragraphs.push(
        new Paragraph({
          text: `Day ${p.dayNumber}: ${p.dayLabel || p.dayName || ''} - [${p.postType}]`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Theme/Hook: ', bold: true }),
            new TextRun({ text: p.theme || p.hook || '' }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Caption:\n', bold: true }),
            new TextRun({ text: p.caption || '' }),
          ],
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Hashtags: ', bold: true, color: '0284C7' }),
            new TextRun({
              text: Array.isArray(p.hashtags) ? p.hashtags.join(' ') : p.hashtags || '',
              italics: true,
              color: '0284C7',
            }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Call to Action: ', bold: true }),
            new TextRun({ text: p.callToAction || '' }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Visual Idea: ', bold: true, color: '64748B' }),
            new TextRun({ text: p.visualIdea || '', italics: true, color: '64748B' }),
          ],
          spacing: { after: 200 },
        })
      );
    });

    const doc = new Document({
      sections: [{ children: paragraphs }],
    });

    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `${baseFilename}.docx`);
    return;
  }
}

// ==========================================
// 2. PRODUCT DESCRIPTION EXPORT
// ==========================================
export async function exportProductDescription(
  prod: any,
  productName: string,
  format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'json'
) {
  const pName = prod.title || prod.productName || productName || 'Product';
  const pTagline = prod.tagline || '';
  const pDesc = prod.description || prod.mainDescription || '';
  const pBullets = prod.bulletBenefits || prod.bulletPoints || [];
  const pCta = prod.suggestedCallToAction || prod.callToAction || '';

  const safeName = sanitizeFilename(pName);
  const dateStr = new Date().toISOString().slice(0, 10);
  const baseFilename = `ContentPilot-Product-Description-${safeName}-${dateStr}`;

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(prod, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    downloadBlob(blob, `${baseFilename}.json`);
    return;
  }

  if (format === 'csv') {
    const headers = ['Attribute', 'Content'];
    const rows = [
      ['Product Title', pName],
      ['Catchy Tagline', pTagline],
      ['Main Description', pDesc],
      ['Key Benefits & Highlights', Array.isArray(pBullets) ? pBullets.join(' | ') : pBullets],
      ['Call to Action', pCta],
    ];

    const csvContent =
      headers.join(',') +
      '\n' +
      rows
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    downloadBlob(blob, `${baseFilename}.csv`);
    return;
  }

  if (format === 'xlsx') {
    const excelData = [
      { Attribute: 'Product Title', Content: pName },
      { Attribute: 'Tagline', Content: pTagline },
      { Attribute: 'Main Description', Content: pDesc },
      {
        Attribute: 'Key Benefits & Highlights',
        Content: Array.isArray(pBullets) ? pBullets.join('; ') : pBullets,
      },
      { Attribute: 'Call to Action', Content: pCta },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [{ wch: 25 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Product Copy');
    XLSX.writeFile(wb, `${baseFilename}.xlsx`);
    return;
  }

  if (format === 'pdf') {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = 18;
    const margin = 15;
    const pageWidth = 180;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(30, 41, 59);
    pdf.text(`Product Description: ${pName}`, margin, y);

    if (pTagline) {
      y += 7;
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(11);
      pdf.setTextColor(79, 70, 229);
      pdf.text(pTagline, margin, y);
    }

    y += 8;
    pdf.setDrawColor(203, 213, 225);
    pdf.line(margin, y, margin + pageWidth, y);
    y += 8;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Full Copy:', margin, y);
    y += 6;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(51, 65, 85);
    const descLines = pdf.splitTextToSize(pDesc, pageWidth);
    pdf.text(descLines, margin, y);
    y += descLines.length * 5 + 6;

    if (pBullets && pBullets.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Key Benefits & Highlights:', margin, y);
      y += 6;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(51, 65, 85);
      pBullets.forEach((bp: string) => {
        const bpLines = pdf.splitTextToSize(`• ${bp}`, pageWidth - 5);
        pdf.text(bpLines, margin + 3, y);
        y += bpLines.length * 5;
      });
      y += 4;
    }

    if (pCta) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`Call To Action: ${pCta}`, margin, y);
    }

    pdf.save(`${baseFilename}.pdf`);
    return;
  }

  if (format === 'docx') {
    const paragraphs: Paragraph[] = [
      new Paragraph({
        text: `Product Description: ${pName}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: pTagline,
            italics: true,
            color: '4F46E5',
            size: 24,
          }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: 'Main Description',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 150, after: 100 },
      }),
      new Paragraph({
        text: pDesc,
        spacing: { after: 200 },
      }),
    ];

    if (pBullets && pBullets.length > 0) {
      paragraphs.push(
        new Paragraph({
          text: 'Key Benefits & Highlights',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 150, after: 100 },
        })
      );
      pBullets.forEach((bp: string) => {
        paragraphs.push(
          new Paragraph({
            text: `• ${bp}`,
            spacing: { after: 60 },
          })
        );
      });
    }

    if (pCta) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Call to Action: ', bold: true }),
            new TextRun({ text: pCta }),
          ],
          spacing: { before: 150, after: 100 },
        })
      );
    }

    const doc = new Document({
      sections: [{ children: paragraphs }],
    });

    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `${baseFilename}.docx`);
    return;
  }
}

// ==========================================
// 3. CUSTOMER REPLIES EXPORT
// ==========================================
export async function exportCustomerReplies(
  replyData: any,
  category: string,
  format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'json'
) {
  const origMsg = replyData.originalMessageSummary || replyData.originalMessage || '';
  const replies = replyData.replies || [];

  const safeCat = sanitizeFilename(category || 'Customer_Reply');
  const dateStr = new Date().toISOString().slice(0, 10);
  const baseFilename = `ContentPilot-Customer-Replies-${safeCat}-${dateStr}`;

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(replyData, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    downloadBlob(blob, `${baseFilename}.json`);
    return;
  }

  if (format === 'csv') {
    const headers = ['Option / Style', 'Tone', 'Response Text', 'When To Use'];
    const rows = replies.map((r: any, i: number) => [
      r.optionTitle || `Option ${i + 1}`,
      r.style || '',
      r.replyText || r.responseText || '',
      r.whenToUse || r.bestUsedFor || '',
    ]);

    const csvContent =
      `Original Customer Message: "${origMsg.replace(/"/g, '""')}"\n\n` +
      headers.join(',') +
      '\n' +
      rows
        .map((row: any[]) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    downloadBlob(blob, `${baseFilename}.csv`);
    return;
  }

  if (format === 'xlsx') {
    const excelData = replies.map((r: any, i: number) => ({
      Option: r.optionTitle || `Option ${i + 1}`,
      Tone: r.style || '',
      'Reply Response Text': r.replyText || r.responseText || '',
      'When To Use': r.whenToUse || r.bestUsedFor || '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [{ wch: 20 }, { wch: 22 }, { wch: 60 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Customer Replies');
    XLSX.writeFile(wb, `${baseFilename}.xlsx`);
    return;
  }

  if (format === 'pdf') {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = 18;
    const margin = 15;
    const pageWidth = 180;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(30, 41, 59);
    pdf.text('ContentPilot AI - Customer Response Kit', margin, y);

    if (origMsg) {
      y += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(71, 85, 105);
      const origLines = pdf.splitTextToSize(`Original Customer Message: "${origMsg}"`, pageWidth);
      pdf.text(origLines, margin, y);
      y += origLines.length * 5 + 4;
    }

    pdf.setDrawColor(203, 213, 225);
    pdf.line(margin, y, margin + pageWidth, y);
    y += 8;

    replies.forEach((r: any, i: number) => {
      if (y > 240) {
        pdf.addPage();
        y = 18;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(79, 70, 229);
      pdf.text(`Option ${i + 1}: ${r.style || r.optionTitle}`, margin, y);
      y += 6;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(51, 65, 85);
      const respText = r.replyText || r.responseText || '';
      const respLines = pdf.splitTextToSize(respText, pageWidth);
      pdf.text(respLines, margin, y);
      y += respLines.length * 5 + 3;

      const useText = r.whenToUse || r.bestUsedFor;
      if (useText) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`Best Used For: ${useText}`, margin, y);
        y += 6;
      }

      y += 4;
      pdf.setDrawColor(241, 245, 249);
      pdf.line(margin, y, margin + pageWidth, y);
      y += 6;
    });

    pdf.save(`${baseFilename}.pdf`);
    return;
  }

  if (format === 'docx') {
    const paragraphs: Paragraph[] = [
      new Paragraph({
        text: 'ContentPilot AI - Customer Response Kit',
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 120 },
      }),
    ];

    if (origMsg) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Original Customer Message: ', bold: true }),
            new TextRun({ text: `"${origMsg}"`, italics: true }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    replies.forEach((r: any, i: number) => {
      paragraphs.push(
        new Paragraph({
          text: `Option ${i + 1}: ${r.style || r.optionTitle}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 180, after: 80 },
        }),
        new Paragraph({
          text: r.replyText || r.responseText || '',
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Best Used For: ', bold: true, color: '64748B' }),
            new TextRun({ text: r.whenToUse || r.bestUsedFor || '', italics: true, color: '64748B' }),
          ],
          spacing: { after: 180 },
        })
      );
    });

    const doc = new Document({
      sections: [{ children: paragraphs }],
    });

    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `${baseFilename}.docx`);
    return;
  }
}
