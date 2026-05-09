import sys
import Quartz
from CoreFoundation import NSURL

def extract_text(pdf_path):
    url = NSURL.fileURLWithPath_(pdf_path)
    pdf = Quartz.PDFDocument.alloc().initWithURL_(url)
    
    if not pdf:
        return "Failed to open PDF"
    
    pages = pdf.pageCount()
    text = []
    for i in range(pages):
        page = pdf.pageAtIndex_(i)
        if page:
            page_text = page.string()
            if page_text:
                text.append(page_text)
    
    return "\n".join(text)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(extract_text(sys.argv[1]))
    else:
        print("Provide PDF path")
