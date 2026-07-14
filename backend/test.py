import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from prompts import GENERATE_QUESTION_PROMPT

load_dotenv()

class NextQuestion(BaseModel):
    question: str = Field(description="The exact text of the next interview question to ask.")
    expected_difficulty: int = Field(description="The difficulty level of the generated question (1-10).")

api_key = os.environ.get("GROQ_API_KEY")
llm = ChatGroq(temperature=0.7, model_name="llama-3.3-70b-versatile", groq_api_key=api_key)

q_parser = PydanticOutputParser(pydantic_object=NextQuestion)
q_prompt = GENERATE_QUESTION_PROMPT.partial(format_instructions=q_parser.get_format_instructions())

q_chain = q_prompt | llm | q_parser

try:
    next_q = q_chain.invoke({
        "interview_type": "Technical",
        "resume_summary": "Software Engineer experienced in React, Node.js, and Python.",
        "difficulty": 5,
        "previous_questions": "None"
    })
    print("SUCCESS")
    print(next_q)
except Exception as e:
    print("FAILED")
    print(str(e))
