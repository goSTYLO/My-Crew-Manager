# test_langchain_llm.py

from LLMs.langchain_llm import build_task_breakdown_chain

def test_project_breakdown():
    chain = build_task_breakdown_chain()
    project_description = "Develop a mobile app for fitness tracking with GPS, calorie counter, and social sharing features."
    result = chain.run(project_description)
    print("\n📋 Task Breakdown:\n")
    print(result)

if __name__ == "__main__":
    test_project_breakdown()