Output demo.gif

Set Shell zsh
Set Width 900
Set Height 550
Set FontSize 14
Set Padding 15
Set TypingSpeed 40ms

Type `node`
Enter
Sleep 1s

Type `const pdf = await import('./dist/index.js')`
Enter
Sleep 1s

Type `// 14 PDF operations available`
Enter
Sleep 300ms
Type `Object.keys(pdf).filter(k => typeof pdf[k] === 'function')`
Enter
Sleep 1.5s

Type `// Create a sample PDF with pdf-lib`
Enter
Sleep 300ms
Type `const { PDFDocument } = await import('pdf-lib')`
Enter
Sleep 500ms
Type `const doc = await PDFDocument.create()`
Enter
Sleep 500ms
Type `doc.addPage([595, 842])`
Enter
Sleep 500ms
Type `const bytes = Buffer.from(await doc.save())`
Enter
Sleep 500ms

Type `// Get info from the PDF`
Enter
Sleep 300ms
Type `await pdf.info(bytes)`
Enter
Sleep 2s

Type `.exit`
Enter
Sleep 500ms
