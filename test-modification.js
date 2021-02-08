var hummus = require('hummus');
const input = path.join(__dirname, 'src', '__tests__', 'data', 'page-1-42.pdf');
var pdfWriter = hummus.createWriterToModify(input, {
    modifiedFilePath: __dirname + '/output/BasicJPGImagesTestPageModified.pdf'
});

var jpgDimensions = pdfWriter.getImageDimensions(__dirname + '/TestMaterials/images/soundcloud_logo.jpg');
cxt.drawRectangle(10,10,jpgDimensions.width/4,jpgDimensions.height/4,pathStrokeOptions);

pdfWriter.getImageType(__dirname + '/TestMaterials/images/otherStage.JPG')
var pageModifier = new hummus.PDFPageModifier(pdfWriter, 0);
// pageModifier.startContext().getContext().writeText(
//     'Test Text',
//     75, 805,
//     {font:pdfWriter.getFontForFile(path.join(__dirname, 'src', '__tests__', 'data', 'page-1-42.pdf'),size:14,colorspace:'gray',color:0x00}
// );

pageModifier.endContext().writePage();
pdfWriter.end();
