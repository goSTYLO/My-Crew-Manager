import pdfplumber

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF with error handling"""
    try:
        full_text = []
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text.append(text.strip())
                    
        if not full_text:
            raise ValueError("No text content found in PDF")
            
        return "\n".join(full_text)
        
    except Exception as e:
        print(f"❌ PDF parsing failed: {str(e)}")
        return ""
