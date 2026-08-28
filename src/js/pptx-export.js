/* ============================================
   PPTX Export Module — Painel Checklist Frota
   Generates executive widescreen 16:9 PowerPoint
   presentations using PptxGenJS.
   ============================================ */

const PPTX_THEMES = {
    dark: {
        id: 'dark',
        name: 'Modo Escuro',
        bg: '0B0F19',
        cardBg: '151D2A',
        cardBorder: '263345',
        headerBg: '101724',
        textPrimary: 'F1F5F9',
        textSecondary: '94A3B8',
        textMuted: '64748B',
        gold: 'F59E0B',
        goldLight: '292014',
        green: '34D399',
        greenLight: '132A22',
        amber: 'FBBF24',
        amberLight: '2D2412',
        red: 'F87171',
        redLight: '2E191B',
        barBg: '1E293B',
        divider: '1E293B'
    },
    light: {
        id: 'light',
        name: 'Modo Claro',
        bg: 'F4F6FA',
        cardBg: 'FFFFFF',
        cardBorder: 'E5E7EB',
        headerBg: 'FFFFFF',
        textPrimary: '111827',
        textSecondary: '4B5563',
        textMuted: '9CA3AF',
        gold: 'D97706',
        goldLight: 'FEF3C7',
        green: '10B981',
        greenLight: 'ECFDF5',
        amber: 'F59E0B',
        amberLight: 'FFFBEB',
        red: 'EF4444',
        redLight: 'FEF2F2',
        barBg: 'E5E7EB',
        divider: 'E5E7EB'
    }
};

const PPTX_MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Filter state data for a set of months or a date range
 * @param {Object} data - state.data
 * @param {string[]} monthsList - list of 'YYYY-MM' strings
 * @returns {Object} filtered aggregated statistics
 */
function aggregateDataForMonths(data, monthsList) {
    const monthsSet = new Set(monthsList);
    const vehicleStats = {}; // plate -> { days: {}, ok, nok, km, model }
    const dailyStats = {};   // date -> { ok, nok }
    const driverStats = {};  // driver -> count of days
    const operationalDates = new Set();
    const nokQuestionsCount = {}; // question -> count

    VEHICLES.forEach(v => {
        vehicleStats[v.plate] = {
            plate: v.plate,
            model: v.model,
            days: {},
            ok: 0,
            nok: 0,
            latestKm: 0,
            conformityPct: null
        };
    });

    Object.entries(data).forEach(([plate, vehicleData]) => {
        if (!vehicleStats[plate]) return;

        Object.entries(vehicleData.days || {}).forEach(([date, dayData]) => {
            const ym = date.substring(0, 7);
            if (!monthsSet.has(ym)) return;

            operationalDates.add(date);
            vehicleStats[plate].days[date] = dayData;

            if (!dailyStats[date]) dailyStats[date] = { ok: 0, nok: 0 };

            Object.entries(dayData.questions || {}).forEach(([q, val]) => {
                if (val === 'OK') {
                    vehicleStats[plate].ok++;
                    dailyStats[date].ok++;
                } else {
                    vehicleStats[plate].nok++;
                    dailyStats[date].nok++;
                    nokQuestionsCount[q] = (nokQuestionsCount[q] || 0) + 1;
                }
            });

            // Driver count
            if (dayData.driver) {
                const drv = dayData.driver.trim();
                if (drv && drv.toLowerCase() !== 'não informado' && drv !== '—') {
                    driverStats[drv] = (driverStats[drv] || 0) + 1;
                }
            }
        });
    });

    // Compute vehicle conformity and latest km
    Object.values(vehicleStats).forEach(v => {
        const total = v.ok + v.nok;
        if (total > 0) {
            v.conformityPct = Math.round((v.ok / total) * 100);
        } else {
            v.conformityPct = null;
        }
        v.latestKm = computeLatestKm(v.days);
    });

    // Compute driver percentages relative to total operational days
    const totalOpDays = operationalDates.size || 1;
    const driverList = Object.entries(driverStats).map(([name, count]) => {
        const pct = Math.min(100, Math.round((count / totalOpDays) * 100));
        return { name, count, pct };
    }).sort((a, b) => b.count - a.count);

    // Total fleet conformity
    let totalOk = 0, totalNok = 0;
    Object.values(vehicleStats).forEach(v => {
        totalOk += v.ok;
        totalNok += v.nok;
    });
    const fleetTotal = totalOk + totalNok;
    const fleetConformity = fleetTotal > 0 ? Math.round((totalOk / fleetTotal) * 100) : 0;

    return {
        vehicleStats,
        dailyStats,
        driverList,
        totalOpDays,
        fleetConformity,
        fleetTotal,
        totalOk,
        totalNok,
        nokQuestionsCount
    };
}

/**
 * Generates an automated 5-line executive AI analysis
 */
function generateExecutiveAnalysis(stats, periodTitle) {
    const { vehicleStats, fleetConformity, fleetTotal, driverList, nokQuestionsCount } = stats;

    if (fleetTotal === 0) {
        return [
            `• Diagnóstico Geral: Sem registros de checklist suficientes no período de ${periodTitle}.`,
            `• Veículos Críticos: Nenhum apontamento mecânico identificado por ausência de dados.`,
            `• Destaques da Frota: Aguardando preenchimento das primeiras vistorias operacionais.`,
            `• Engajamento dos Condutores: Necessário incentivar a alimentação diária dos formulários.`,
            `• Recomendação: Verificar a regularidade dos condutores na utilização do checklist.`
        ];
    }

    const vehicles = Object.values(vehicleStats);
    const withData = vehicles.filter(v => v.conformityPct !== null);
    
    // Sort by conformity
    const criticalVehicles = [...withData].filter(v => v.conformityPct < 90).sort((a, b) => a.conformityPct - b.conformityPct);
    const attentionVehicles = [...withData].filter(v => v.conformityPct >= 90 && v.conformityPct < 95);
    const topVehicles = [...withData].filter(v => v.conformityPct >= 95).sort((a, b) => b.conformityPct - a.conformityPct);

    // Top NOK questions
    const topNokList = Object.entries(nokQuestionsCount).sort((a, b) => b[1] - a[1]);
    const topNokIssues = topNokList.slice(0, 2).map(([q]) => q.toLowerCase()).join(', ');

    // 1. Linha 1: Diagnóstico Geral
    let line1 = '';
    if (fleetConformity >= 95) {
        line1 = `• Conformidade Geral: Nível de excelência operacional com ${fleetConformity}% de itens conformes em ${periodTitle}.`;
    } else if (fleetConformity >= 90) {
        line1 = `• Conformidade Geral: Nível estável de ${fleetConformity}%, com desvios pontuais requerendo monitoramento.`;
    } else {
        line1 = `• Conformidade Geral: Índice de ${fleetConformity}% abaixo da meta operacional (95%), exigindo plano de ação corretivo.`;
    }

    // 2. Linha 2: Veículos Críticos
    let line2 = '';
    if (criticalVehicles.length > 0) {
        const critNames = criticalVehicles.map(v => `${v.plate} (${v.conformityPct}%)`).slice(0, 3).join(', ');
        line2 = `• Veículos Críticos: Atenção urgente para ${critNames}${topNokIssues ? ` com reincidências em ${topNokIssues}` : ''}.`;
    } else if (attentionVehicles.length > 0) {
        const attNames = attentionVehicles.map(v => `${v.plate} (${v.conformityPct}%)`).slice(0, 3).join(', ');
        line2 = `• Pontos de Atenção: Frotas ${attNames} em zona intermediária de conformidade (90%-94%).`;
    } else {
        line2 = `• Veículos Críticos: Nenhum veículo em estado crítico; toda a frota operou acima de 95% de conformidade.`;
    }

    // 3. Linha 3: Destaques Positivos
    let line3 = '';
    if (topVehicles.length > 0) {
        const topNames = topVehicles.slice(0, 4).map(v => `${v.plate} (${v.conformityPct}%)`).join(', ');
        line3 = `• Destaques da Frota: Desempenho exemplar de ${topNames}, assegurando alta disponibilidade mecânica.`;
    } else {
        line3 = `• Destaques da Frota: Sem veículos atingindo o índice padrão de 95% de conformidade neste ciclo.`;
    }

    // 4. Linha 4: Engajamento dos Condutores
    let line4 = '';
    if (driverList.length > 0) {
        const bestDrivers = driverList.slice(0, 2).map(d => `${d.name} (${d.pct}%)`).join(' e ');
        const avgEngage = Math.round(driverList.reduce((acc, d) => acc + d.pct, 0) / driverList.length);
        line4 = `• Engajamento dos Motoristas: Média de ${avgEngage}% de preenchimento, liderado por ${bestDrivers}.`;
    } else {
        line4 = `• Engajamento dos Motoristas: Registros incompletos de condutores no período analisado.`;
    }

    // 5. Linha 5: Recomendações Práticas
    let line5 = '';
    if (criticalVehicles.length > 0 || fleetConformity < 93) {
        line5 = `• Recomendação: Programar revisão preventiva prioritária nos itens sinalizados e alinhar checklist com os condutores.`;
    } else if (fleetConformity >= 96 && driverList.length > 0 && driverList[0].pct >= 85) {
        line5 = `• Recomendação: Manter as rotinas preventivas e parabenizar a equipe pela disciplina operacional e conservação da frota.`;
    } else {
        line5 = `• Recomendação: Reforçar o acompanhamento diário das ordens de serviço para assegurar índices acima de 95%.`;
    }

    return [line1, line2, line3, line4, line5];
}

/**
 * Creates an offscreen Canvas image of the conformity line chart for PPTX
 */
function renderChartToDataUrl(dailyStats, theme) {
    const canvas = document.createElement('canvas');
    canvas.width = 1100;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');

    const isDark = theme.id === 'dark';
    const bgFill = isDark ? '#151D2A' : '#FFFFFF';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#94A3B8' : '#6B7280';
    const lineColor = isDark ? '#34D399' : '#10B981';

    // Background
    ctx.fillStyle = bgFill;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const sortedDates = Object.keys(dailyStats).sort();
    if (sortedDates.length === 0) {
        ctx.fillStyle = textColor;
        ctx.font = 'bold 24px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Sem dados diários no período', canvas.width / 2, canvas.height / 2);
        return canvas.toDataURL('image/png');
    }

    const padding = { top: 40, right: 40, bottom: 60, left: 60 };
    const chartW = canvas.width - padding.left - padding.right;
    const chartH = canvas.height - padding.top - padding.bottom;

    // Y Axis Grid lines (0%, 25%, 50%, 75%, 100%)
    ctx.lineWidth = 1;
    ctx.strokeStyle = gridColor;
    ctx.fillStyle = textColor;
    ctx.font = '16px Inter, Arial, sans-serif';
    ctx.textAlign = 'right';

    [0, 25, 50, 75, 100].forEach(val => {
        const y = padding.top + chartH - (val / 100) * chartH;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(canvas.width - padding.right, y);
        ctx.stroke();
        ctx.fillText(`${val}%`, padding.left - 12, y + 5);
    });

    // Points calculation
    const points = sortedDates.map((date, idx) => {
        const s = dailyStats[date];
        const total = s.ok + s.nok;
        const pct = total > 0 ? (s.ok / total) * 100 : 0;
        const x = padding.left + (idx / Math.max(1, sortedDates.length - 1)) * chartW;
        const y = padding.top + chartH - (pct / 100) * chartH;
        return { x, y, pct, date };
    });

    // Gradient fill under the curve
    if (points.length > 1) {
        const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
        grad.addColorStop(0, isDark ? 'rgba(52, 211, 153, 0.35)' : 'rgba(16, 185, 129, 0.25)');
        grad.addColorStop(1, isDark ? 'rgba(52, 211, 153, 0.02)' : 'rgba(16, 185, 129, 0.01)');

        ctx.beginPath();
        ctx.moveTo(points[0].x, padding.top + chartH);
        points.forEach((p, idx) => {
            if (idx === 0) ctx.lineTo(p.x, p.y);
            else {
                const prev = points[idx - 1];
                const cx = (prev.x + p.x) / 2;
                ctx.bezierCurveTo(cx, prev.y, cx, p.y, p.x, p.y);
            }
        });
        ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
    }

    // Line drawing
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = lineColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    points.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else {
            const prev = points[idx - 1];
            const cx = (prev.x + p.x) / 2;
            ctx.bezierCurveTo(cx, prev.y, cx, p.y, p.x, p.y);
        }
    });
    ctx.stroke();

    // Dots and X labels
    const step = Math.ceil(points.length / 10);
    ctx.textAlign = 'center';
    ctx.font = '14px Inter, Arial, sans-serif';

    points.forEach((p, idx) => {
        // Draw point dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#0B0F19' : '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = lineColor;
        ctx.stroke();

        // X Label
        if (idx % step === 0 || idx === points.length - 1) {
            const [, m, day] = p.date.split('-');
            const label = `${parseInt(day)}/${parseInt(m)}`;
            ctx.fillStyle = textColor;
            ctx.fillText(label, p.x, padding.top + chartH + 26);
        }
    });

    return canvas.toDataURL('image/png');
}

/**
 * Builds a single slide in PowerPoint (Widescreen 16:9)
 */
function addDashboardSlide(pres, theme, title, subtitleDate, stats) {
    const slide = pres.addSlide();
    slide.background = { color: theme.bg };

    // ─── 1. HEADER (x: 0.4, y: 0.20, w: 9.2, h: 0.52) ───
    slide.addShape(pres.ShapeType.roundRect, {
        x: 0.4, y: 0.20, w: 9.2, h: 0.52,
        fill: { color: theme.cardBg },
        line: { color: theme.cardBorder, width: 1 },
        radius: 0.06
    });

    // EFX Logo Text / Badge
    slide.addText("GRUPO EFX", {
        x: 0.55, y: 0.27, w: 1.5, h: 0.35,
        fontSize: 13, fontFace: 'Inter',
        color: theme.gold, bold: true
    });

    // Title
    slide.addText(title, {
        x: 2.1, y: 0.25, w: 5.2, h: 0.38,
        fontSize: 14, fontFace: 'Inter',
        color: theme.textPrimary, bold: true
    });

    // Period / Date Badge
    slide.addShape(pres.ShapeType.roundRect, {
        x: 7.40, y: 0.27, w: 2.05, h: 0.35,
        fill: { color: theme.goldLight },
        line: { color: theme.gold, width: 1 },
        radius: 0.06
    });

    slide.addText(subtitleDate, {
        x: 7.40, y: 0.27, w: 2.05, h: 0.35,
        fontSize: 9.5, fontFace: 'Inter',
        color: theme.gold, bold: true, align: 'center', valign: 'middle'
    });

    // ─── 2. VEHICLE CARDS (x: 0.4, y: 0.80, w: 9.2, h: 1.60) ───
    const cardsPerRow = 5;
    const cardW = 1.76;
    const cardH = 0.72;
    const gapX = 0.10;
    const gapY = 0.08;

    VEHICLES.forEach((v, idx) => {
        const row = Math.floor(idx / cardsPerRow);
        const col = idx % cardsPerRow;
        const cx = 0.4 + col * (cardW + gapX);
        const cy = 0.80 + row * (cardH + gapY);

        const vStat = stats.vehicleStats[v.plate] || { conformityPct: null, latestKm: 0 };
        const pct = vStat.conformityPct;

        // Color based on user rules: >= 95% Green, 90-94% Amber, < 90% Red
        let pctColor = theme.textMuted;
        let pctText = '—';
        let statusText = 'sem dados';
        if (pct !== null) {
            pctText = `${pct}%`;
            statusText = 'conforme';
            if (pct >= 95) pctColor = theme.green;
            else if (pct >= 90) pctColor = theme.amber;
            else pctColor = theme.red;
        }

        const kmText = vStat.latestKm > 0 ? `${vStat.latestKm.toLocaleString('pt-BR')} km` : 'Sem reg.';

        // Card Container
        slide.addShape(pres.ShapeType.roundRect, {
            x: cx, y: cy, w: cardW, h: cardH,
            fill: { color: theme.cardBg },
            line: { color: theme.cardBorder, width: 1 },
            radius: 0.06
        });

        // Plate
        slide.addText(v.plate, {
            x: cx + 0.08, y: cy + 0.05, w: 1.0, h: 0.20,
            fontSize: 10, fontFace: 'Inter',
            color: theme.textPrimary, bold: true
        });

        // Model Tag
        slide.addText(v.model, {
            x: cx + 1.05, y: cy + 0.05, w: 0.62, h: 0.18,
            fontSize: 7.5, fontFace: 'Inter',
            color: theme.textMuted, align: 'right'
        });

        // Conformity Percentage
        slide.addText(pctText, {
            x: cx + 0.08, y: cy + 0.25, w: 0.85, h: 0.25,
            fontSize: 14, fontFace: 'Inter',
            color: pctColor, bold: true
        });

        // Conformity Label
        slide.addText(statusText, {
            x: cx + 0.90, y: cy + 0.29, w: 0.78, h: 0.18,
            fontSize: 7.5, fontFace: 'Inter',
            color: theme.textMuted, align: 'left'
        });

        // Conformity Progress Bar Background
        slide.addShape(pres.ShapeType.rect, {
            x: cx + 0.08, y: cy + 0.51, w: cardW - 0.16, h: 0.03,
            fill: { color: theme.barBg },
            line: { color: theme.barBg, width: 0 }
        });

        // Filled Progress Bar
        if (pct !== null && pct > 0) {
            slide.addShape(pres.ShapeType.rect, {
                x: cx + 0.08, y: cy + 0.51, w: (cardW - 0.16) * (pct / 100), h: 0.03,
                fill: { color: pctColor },
                line: { color: pctColor, width: 0 }
            });
        }

        // KM Footer
        slide.addText(`KM: ${kmText}`, {
            x: cx + 0.08, y: cy + 0.55, w: cardW - 0.16, h: 0.15,
            fontSize: 7, fontFace: 'Inter',
            color: theme.textSecondary, align: 'center'
        });
    });

    // ─── 3. MIDDLE ROW (x: 0.4, y: 2.46, w: 9.2, h: 1.62) ───
    const chartW = 5.50;
    const engageW = 3.60;
    const midY = 2.46;
    const midH = 1.62;

    // --- Chart Box (Left) ---
    slide.addShape(pres.ShapeType.roundRect, {
        x: 0.4, y: midY, w: chartW, h: midH,
        fill: { color: theme.cardBg },
        line: { color: theme.cardBorder, width: 1 },
        radius: 0.06
    });

    slide.addText("Evolução da Conformidade Diária (%)", {
        x: 0.55, y: midY + 0.08, w: 4.5, h: 0.22,
        fontSize: 11, fontFace: 'Inter',
        color: theme.textPrimary, bold: true
    });

    // Render Canvas chart image
    const chartImgData = renderChartToDataUrl(stats.dailyStats, theme);
    slide.addImage({
        data: chartImgData,
        x: 0.45, y: midY + 0.32, w: chartW - 0.10, h: midH - 0.36
    });

    // --- Driver Engagement Box (Right) ---
    const engageX = 0.4 + chartW + 0.10;
    slide.addShape(pres.ShapeType.roundRect, {
        x: engageX, y: midY, w: engageW, h: midH,
        fill: { color: theme.cardBg },
        line: { color: theme.cardBorder, width: 1 },
        radius: 0.06
    });

    slide.addText("Engajamento dos Motoristas (%)", {
        x: engageX + 0.15, y: midY + 0.08, w: 3.3, h: 0.22,
        fontSize: 11, fontFace: 'Inter',
        color: theme.textPrimary, bold: true
    });

    // Driver table list
    const driversToShow = stats.driverList.slice(0, 5);
    if (driversToShow.length === 0) {
        slide.addText("Nenhum registro de condutor", {
            x: engageX + 0.15, y: midY + 0.60, w: 3.3, h: 0.30,
            fontSize: 10, fontFace: 'Inter',
            color: theme.textMuted, align: 'center'
        });
    } else {
        driversToShow.forEach((drv, i) => {
            const dy = midY + 0.34 + i * 0.24;
            
            // Driver Name
            slide.addText(`${i + 1}. ${drv.name}`, {
                x: engageX + 0.15, y: dy, w: 2.2, h: 0.20,
                fontSize: 9, fontFace: 'Inter',
                color: theme.textPrimary, bold: false
            });

            // Engagement Badge %
            let badgeColor = theme.green;
            if (drv.pct < 70) badgeColor = theme.red;
            else if (drv.pct < 90) badgeColor = theme.amber;

            slide.addShape(pres.ShapeType.roundRect, {
                x: engageX + 2.50, y: dy - 0.01, w: 0.95, h: 0.20,
                fill: { color: theme.id === 'dark' ? '1E293B' : 'F3F4F6' },
                line: { color: badgeColor, width: 1 },
                radius: 0.04
            });

            slide.addText(`${drv.pct}% (${drv.count}d)`, {
                x: engageX + 2.50, y: dy - 0.01, w: 0.95, h: 0.20,
                fontSize: 8, fontFace: 'Inter',
                color: badgeColor, bold: true, align: 'center', valign: 'middle'
            });
        });
    }

    // ─── 4. BOTTOM ROW: 5-LINE AI ANALYSIS (x: 0.4, y: 4.16, w: 9.2, h: 1.28) ───
    const botY = 4.16;
    const botH = 1.28;

    slide.addShape(pres.ShapeType.roundRect, {
        x: 0.4, y: botY, w: 9.2, h: botH,
        fill: { color: theme.cardBg },
        line: { color: theme.cardBorder, width: 1 },
        radius: 0.06
    });

    slide.addText("Análise Executiva IA — Diagnóstico de Operação e Engajamento", {
        x: 0.55, y: botY + 0.06, w: 8.9, h: 0.20,
        fontSize: 10.5, fontFace: 'Inter',
        color: theme.gold, bold: true
    });

    // 5 Lines of AI Analysis
    const analysisLines = generateExecutiveAnalysis(stats, subtitleDate);
    const analysisTextObjects = analysisLines.map((line, idx) => ({
        text: line + (idx < analysisLines.length - 1 ? '\n' : ''),
        options: {
            fontSize: 8.5,
            fontFace: 'Inter',
            color: theme.textPrimary,
            paraSpaceAfter: 2
        }
    }));

    slide.addText(analysisTextObjects, {
        x: 0.55, y: botY + 0.27, w: 8.9, h: 0.95,
        align: 'left',
        valign: 'top',
        lineSpacing: 12
    });
}

/**
 * Main Export Function
 * Orchestrates PowerPoint generation based on user preferences.
 */
async function generatePowerPointPresentation({ themeId, startMonth, endMonth, includeCompiled, includeMonthly, onProgress }) {
    if (!window.PptxGenJS) {
        throw new Error('A biblioteca PptxGenJS não foi carregada no navegador.');
    }

    const theme = PPTX_THEMES[themeId] || PPTX_THEMES.dark;
    const pres = new window.PptxGenJS();
    pres.layout = 'LAYOUT_16x9';
    pres.author = 'Painel Checklist Frota — Grupo EFX';
    pres.title = 'Relatório Executivo de Conformidade da Frota';

    if (onProgress) onProgress('Coletando e estruturando dados...');

    // Extract all unique months available in state.data
    const allMonths = new Set();
    Object.values(state.data).forEach(vehicleData => {
        Object.keys(vehicleData.days || {}).forEach(date => {
            if (date.length >= 7) allMonths.add(date.substring(0, 7));
        });
    });

    const sortedAllMonths = Array.from(allMonths).sort(); // chronological order

    // Filter months within selected range [startMonth, endMonth]
    const validMonths = sortedAllMonths.filter(m => m >= startMonth && m <= endMonth);

    if (validMonths.length === 0) {
        throw new Error('Nenhum dado encontrado para o período selecionado.');
    }

    // Determine period label
    const formatMonthLabel = (ym) => {
        const [y, m] = ym.split('-');
        return `${PPTX_MONTH_NAMES[parseInt(m) - 1]} ${y}`;
    };

    const periodRangeLabel = validMonths.length > 1
        ? `${formatMonthLabel(validMonths[0])} a ${formatMonthLabel(validMonths[validMonths.length - 1])}`
        : formatMonthLabel(validMonths[0]);

    // 1. First Slide: Compiled (if selected)
    if (includeCompiled) {
        if (onProgress) onProgress('Construindo slide compilado do período...');
        const compiledStats = aggregateDataForMonths(state.data, validMonths);
        const compiledTitle = `Visão Compilada da Frota — ${periodRangeLabel}`;
        addDashboardSlide(pres, theme, compiledTitle, periodRangeLabel, compiledStats);
    }

    // 2. Subsequent Slides: Monthly in chronological order (if selected)
    if (includeMonthly) {
        for (let i = 0; i < validMonths.length; i++) {
            const monthYm = validMonths[i];
            const monthTitle = `Visão Mensal da Frota — ${formatMonthLabel(monthYm)}`;
            if (onProgress) onProgress(`Construindo slide de ${formatMonthLabel(monthYm)}...`);
            const monthStats = aggregateDataForMonths(state.data, [monthYm]);
            addDashboardSlide(pres, theme, monthTitle, formatMonthLabel(monthYm), monthStats);
        }
    }

    if (onProgress) onProgress('Finalizando arquivo .pptx...');

    const filename = `Relatorio_Frota_EFX_${startMonth}_a_${endMonth}_${themeId}.pptx`;
    await pres.writeFile({ fileName: filename });

    if (onProgress) onProgress('Download concluído!');
}

window.generatePowerPointPresentation = generatePowerPointPresentation;
window.PPTX_MONTH_NAMES = PPTX_MONTH_NAMES;
