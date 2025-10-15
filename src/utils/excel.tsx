
import * as XLSX from 'xlsx-js-style';


export const ExcelHelper = {
    IVA_CODES: new Set(['IVA 0%', 'IVA 2,5%', 'IVA 5%', 'IVA 10,5%', 'IVA 21%', 'IVA 27%', 'IVA Exento', 'IVA No gravado']),
    escapeXml: (value: string) =>
        value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;'),

    generateTemplate: async () => {
        {
            const workbook = XLSX.utils.book_new()
            const headers = [
                'N Factura',
                'Punto de Venta',
                'Concepto',
                'Descripcion',
                'Cantidad',
                'Precio Unitario',
                'IVA',
                'Condicion Venta',
                'Fecha Emision',
                'Servicio Desde',
                'Servicio Hasta',
                'Vencimiento Pago',
                'Condicion IVA',
                'Tipo de Documento',
                'Numero de Documento',
                'Nombre',
                'Domicilio'
            ] as const

            const headerStyle = {
                fill: { patternType: "solid", fgColor: { rgb: "4F81BD" } }, // azul
                font: { color: { rgb: "FFFFFF" }, bold: true }, // texto blanco, negrita
                alignment: { horizontal: "center", vertical: "center" },
            };
            const groupRow = new Array(headers.length).fill('')
            groupRow[0] = 'Comprobante'
            groupRow[11] = 'Receptor'
            const worksheet = XLSX.utils.aoa_to_sheet([
                groupRow,
                [...headers],
            ])
            worksheet['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
                { s: { r: 0, c: 11 }, e: { r: 0, c: headers.length - 1 } }
            ]

            worksheet['!cols'] = [
                { wch: 12 }, // N Factura
                { wch: 15 }, // Punto de Venta
                { wch: 15 }, // Concepto
                { wch: 30 }, // Descripción
                { wch: 10 }, // Cantidad
                { wch: 15 }, // Precio Unitario
                { wch: 10 }, // IVA
                { wch: 18 }, // Condición Venta
                { wch: 15 }, // Fecha Emisión
                { wch: 15 }, // Servicio Desde
                { wch: 15 }, // Servicio Hasta
                { wch: 18 }, // Vencimiento Pago
                { wch: 18 }, // Condición IVA
                { wch: 18 }, // Tipo de Documento
                { wch: 20 }, // Número de Documento
                { wch: 25 }, // Nombre
                { wch: 30 }, // Domicilio
            ];

            for (let c = 0; c < headers.length; c++) {
                const cellRef = XLSX.utils.encode_cell({ r: 1, c });
                if (worksheet[cellRef]) worksheet[cellRef].s = headerStyle;
            }
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo')

            try {
                const arrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', compression: true })
                const { default: JSZip } = await import('jszip')
                const zip = await JSZip.loadAsync(arrayBuffer)
                const sheetPath = 'xl/worksheets/sheet1.xml'
                const sheetFile = zip.file(sheetPath)
                let dateStyleIndex: number | null = null
                const stylesPath = 'xl/styles.xml'
                const stylesFile = zip.file(stylesPath)
                if (stylesFile) {
                    let stylesXml = await stylesFile.async('string')
                    const cellXfsMatch = stylesXml.match(/<cellXfs[^>]*count="(\d+)"[^>]*>([\s\S]*?)<\/cellXfs>/)
                    if (cellXfsMatch) {
                        const count = Number(cellXfsMatch[1])
                        const inner = cellXfsMatch[2]
                        const xfRegex = /<xf\b[^>]*>/g
                        let match: RegExpExecArray | null
                        let index = 0
                        let found = false
                        while ((match = xfRegex.exec(inner)) !== null) {
                            if (/numFmtId="14"/.test(match[0])) {
                                dateStyleIndex = index
                                found = true
                                break
                            }
                            index += 1
                        }
                        if (!found) {
                            const newXf = '<xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
                            const updatedInner = `${inner}${newXf}`
                            stylesXml = stylesXml.replace(cellXfsMatch[0], `<cellXfs count="${count + 1}">${updatedInner}</cellXfs>`)
                            dateStyleIndex = count
                        }
                    }
                    if (dateStyleIndex !== null) {
                        zip.file(stylesPath, stylesXml)
                    }
                }

                if (sheetFile) {
                    const conceptColumn = XLSX.utils.encode_col(1) // Column B
                    const ivaColumn = XLSX.utils.encode_col(headers.indexOf('IVA'))
                    const servicioDesdeColumn = XLSX.utils.encode_col(headers.indexOf('Servicio Desde'))
                    const servicioHastaColumn = XLSX.utils.encode_col(headers.indexOf('Servicio Hasta'))
                    const vencimientoColumn = XLSX.utils.encode_col(headers.indexOf('Vencimiento Pago'))
                    const startRow = 3
                    const lastRow = 1048576
                    const conceptRange = `${conceptColumn}${startRow}:${conceptColumn}${lastRow}`
                    const ivaRange = `${ivaColumn}${startRow}:${ivaColumn}${lastRow}`
                    const servicioDesdeRange = `${servicioDesdeColumn}${startRow}:${servicioDesdeColumn}${lastRow}`
                    const servicioHastaRange = `${servicioHastaColumn}${startRow}:${servicioHastaColumn}${lastRow}`
                    const vencimientoRange = `${vencimientoColumn}${startRow}:${vencimientoColumn}${lastRow}`
                    const conceptCell = `$${conceptColumn}${startRow}`
                    const ivaOptions = Array.from(ExcelHelper.IVA_CODES).join(',')
                    const servicioDesdeCell = `${servicioDesdeColumn}${startRow}`
                    const servicioHastaCell = `${servicioHastaColumn}${startRow}`
                    const vencimientoCell = `${vencimientoColumn}${startRow}`
                    const conceptFormula = '"Productos,Servicios"'
                    const ivaFormula = `"${ivaOptions}"`
                    const servicioDesdeFormula = `OR(AND(${conceptCell}<>"Servicios",${servicioDesdeCell}=""),AND(${conceptCell}="Servicios",OR(${servicioDesdeCell}="",ISNUMBER(${servicioDesdeCell}))))`
                    const servicioHastaFormula = `OR(AND(${conceptCell}<>"Servicios",${servicioHastaCell}=""),AND(${conceptCell}="Servicios",OR(${servicioHastaCell}="",ISNUMBER(${servicioHastaCell}))))`
                    const vencimientoFormula = `OR(${vencimientoCell}="",ISNUMBER(${vencimientoCell}))`
                    const validations = [
                        `<dataValidation type="list" allowBlank="1" sqref="${ivaRange}"><formula1>${ExcelHelper.escapeXml(ivaFormula)}</formula1></dataValidation>`,
                        `<dataValidation type="list" allowBlank="1" sqref="${conceptRange}"><formula1>${ExcelHelper.escapeXml(conceptFormula)}</formula1></dataValidation>`,
                        `<dataValidation type="custom" allowBlank="1" sqref="${servicioDesdeRange}"><formula1>${ExcelHelper.escapeXml(servicioDesdeFormula)}</formula1></dataValidation>`,
                        `<dataValidation type="custom" allowBlank="1" sqref="${servicioHastaRange}"><formula1>${ExcelHelper.escapeXml(servicioHastaFormula)}</formula1></dataValidation>`,
                        `<dataValidation type="custom" allowBlank="1" sqref="${vencimientoRange}"><formula1>${ExcelHelper.escapeXml(vencimientoFormula)}</formula1></dataValidation>`
                    ]
                    const validationXml = `<dataValidations count="${validations.length}">${validations.join('')}</dataValidations>`
                    let sheetXml = await sheetFile.async('string')
                    if (sheetXml.includes('<dataValidations')) {
                        sheetXml = sheetXml.replace(/<dataValidations[^>]*>[\s\S]*?<\/dataValidations>/, validationXml)
                    } else if (sheetXml.includes('<ignoredErrors')) {
                        sheetXml = sheetXml.replace('<ignoredErrors', `${validationXml}<ignoredErrors`)
                    } else {
                        sheetXml = sheetXml.replace('</worksheet>', `${validationXml}</worksheet>`)
                    }
                    if (dateStyleIndex !== null) {
                        const colTag = `<col min="8" max="11" style="${dateStyleIndex}" customWidth="1"/>`
                        const colsTag = `<cols>${colTag}</cols>`
                        if (sheetXml.includes('<cols')) {
                            sheetXml = sheetXml.replace(/<cols[^>]*>/, match => `${match}${colTag}`)
                        } else if (sheetXml.includes('</sheetViews>')) {
                            sheetXml = sheetXml.replace('</sheetViews>', `</sheetViews>${colsTag}`)
                        } else {
                            sheetXml = sheetXml.replace('<sheetData>', `${colsTag}<sheetData>`)
                        }
                    }
                    zip.file(sheetPath, sheetXml)
                }
                const blob = await zip.generateAsync({ type: 'blob' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = 'carga-masiva-emitir-modelo.xlsx'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
            } catch (error) {
                console.error('No se pudo generar el dropdown del modelo, se descargará sin esa mejora.', error)
                XLSX.writeFile(workbook, 'carga-masiva-emitir-modelo.xlsx', { compression: true })
            }
        }
    }
}