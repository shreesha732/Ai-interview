from langchain.prompts import PromptTemplate

EVALUATE_ANSWER_PROMPT = PromptTemplate(
    template="""You are an expert interviewer and communication coach evaluating a candidate's answer.
Interview Type: {interview_type}
Question Asked: {question}
Candidate's Answer Transcript: {answer}

Speech Analytics Data Provided by System:
{speech_analytics}

Evaluate the candidate's answer based on the following criteria. Give a score from 1-10 for each:
1. Grammar
2. Clarity
3. Relevance to the question
4. STAR format (Situation, Task, Action, Result) - especially if behavioral
5. Technical accuracy (if a technical question)
6. Communication quality (incorporate the speech analytics like filler words and speed)
7. Overall Confidence

Provide detailed feedback, including strengths and weaknesses.

{format_instructions}""",
    input_variables=["interview_type", "question", "answer", "speech_analytics"],
    partial_variables={"format_instructions": ""}
)

GENERATE_QUESTION_PROMPT = PromptTemplate(
    template="""You are an expert interviewer conducting a {interview_type} interview.
Candidate Background:
{resume_summary}

Target Difficulty Level (1-10): {difficulty}
(1 = Beginner, 5 = Intermediate, 10 = Expert/Deep dive)

Previous Questions Asked:
{previous_questions}

Generate the next interview question for the candidate. It should be highly relevant to their background and the interview type. It must match the target difficulty level.
DO NOT repeat previous questions.
Only return the text of the question.
""",
    input_variables=["interview_type", "resume_summary", "difficulty", "previous_questions"]
)
