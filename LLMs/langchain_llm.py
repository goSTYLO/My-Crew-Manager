from transformers import pipeline
from langchain_community.llms import HuggingFacePipeline
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

# Load the Project Management LLM from Hugging Face using pipeline
def load_project_manager_llm(model_id: str = "ai-in-projectmanagement/ProjectManagementLLM") -> HuggingFacePipeline:
    text_gen = pipeline(
        "text-generation",
        model=model_id,
        device=0,  # 👈 Use GPU
        max_new_tokens=512,
        temperature=0.7,
        do_sample=True
    )
    return HuggingFacePipeline(pipeline=text_gen)

# Build a LangChain LLMChain for task breakdowns
def build_task_breakdown_chain() -> LLMChain:
    llm = load_project_manager_llm()
    prompt = PromptTemplate.from_template(
        "Break down the following project into tasks: {project_description}"
    )
    return LLMChain(llm=llm, prompt=prompt)

if __name__ == "__main__":
    chain = build_task_breakdown_chain()
    result = chain.run("Build a mobile app for remote team coordination")
    print(result)