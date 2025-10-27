#!/usr/bin/env python3

content = """VITE_API_BASE_URL=http://localhost:8000

DEBUG=True
SECRET_KEY=django-insecure-c-5y7c^n+=8ci@_a4ebrflde2o@%w$@iur0e7&582*&x4v(g=z   
DB_NAME=mycrewmanager_db
DB_USER=postgres
DB_PASSWORD=1401
DB_HOST=localhost
DB_PORT=5432


# API Keys (Required to enable respective provider)
ANTHROPIC_API_KEY="your_anthropic_api_key_here"       # Required: Format: sk-ant-api03-...                                                                      
PERPLEXITY_API_KEY="your_perplexity_api_key_here"     # Optional: Format: pplx-...                                                                              
OPENAI_API_KEY="your_openai_api_key_here"             # Optional, for OpenAI models. Format: sk-proj-...                                                        
GOOGLE_API_KEY="your_google_api_key_here"             # Optional, for Google Gemini models.                                                                     
MISTRAL_API_KEY="your_mistral_key_here"               # Optional, for Mistral AI models.                                                                        
XAI_API_KEY="YOUR_XAI_KEY_HERE"                       # Optional, for xAI AI models.                                                                            
GROQ_API_KEY="YOUR_GROQ_KEY_HERE"                     # Optional, for Groq models.                                                                              
OPENROUTER_API_KEY="YOUR_OPENROUTER_KEY_HERE"         # Optional, for OpenRouter models.                                                                        
AZURE_OPENAI_API_KEY="your_azure_key_here"            # Optional, for Azure OpenAI models (requires endpoint in .taskmaster/config.json).                       
OLLAMA_API_KEY="your_ollama_api_key_here"             # Optional: For remote Ollama servers that require authentication.                                        
GITHUB_API_KEY="your_github_api_key_here"             # Optional: For GitHub import/export features. Format: ghp_... or github_pat_...                          
"""

with open('.env', 'w', encoding='utf-8') as f:
    f.write(content)

print('File created successfully')
