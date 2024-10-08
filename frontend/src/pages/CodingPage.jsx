import React, { useRef, useState, useEffect } from "react";
import "../style/CodingPage.scss";
import "../style/CodeBroLogo.scss";
import CodeEditor from "../components/CodeEditor";
import Navbar from "../components/Navbar";
import CodeHeader from "../components/CodeHeader";

import axios from "axios";
import Output from "../components/Output";
import { useToast } from "@chakra-ui/react";
import { images } from "../javascripts/images";
import { executeCode } from "../javascripts/api";
import { useSelector, useDispatch } from "react-redux";
import {
  addAllOutput,
  addAllResult,
  setIsSubmitted,
  addLanguage,
  addTestCaseOutput,
  addTestCaseResults,
  setAttempts,
  addProblemObj,
  setIsSolved,
} from "../store/problemObjSlice";
import { setLeaderBoardEntries } from "../store/leaderBoardSlice";
import CodeInfoContainer from "../components/CodeInfoContainer";
import { setUserProblems } from "../store/userSlice";
import { AllquesObject } from "../javascripts/data";
import { setSolvedProblems } from "../store/solvedProblemsReducer";
import { setStoreAttempts } from "../store/attemptsSlice";
function CodingPage() {
  const editorRef = useRef();
  const codingDiv = useRef();
  const toast = useToast();
  const dispatch = useDispatch();
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [userImage, setUserImage] = useState(images.accDefaultLogo);
  const [allOutput, setAllOutput] = useState([]);
  const [allResult, setAllResult] = useState([]);
  const [testCaseOutput, setTestCaseOutput] = useState([]);
  const [testCaseResult, setTestCaseResult] = useState([]);
  const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
  const [jsSolved, setJsSolved] = useState(0);
  const [pythonSolved, setPythonSolved] = useState(0);
  const [javaSolved, setJavaSolved] = useState(0);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const attempts = useSelector((state) => state.attempts.attempts);

  // const backend_url = import.meta.env.REACT_APP_BACKEND_URL;

  const problemObj = useSelector((state) => state.problemObj.obj);
  const solvedProblems = useSelector(
    (state) => state.solvedProblems.solvedProblems
  );
  const userObj = useSelector((state) => state.user);
  const [value, setValue] = useState(problemObj.javascriptDefaultCode);
  const [loadSolvedTickMark, setLoadSolvedTickMark] = useState(false);
  useEffect(() => {
    axios
      .get(`${VITE_BACKEND_URL}/problemRecord`, {
        params: { userEmail: localStorage.getItem("email") },
      })
      .then((response) => {
        const allProblems = Array.isArray(response.data.allProblems)
          ? response.data.allProblems
          : [];
        const solvedProblems = allProblems.reduce((acc, item) => {
          acc[item.number] = item.attempts > 0;
          return acc;
        }, {});
        console.log(
          "solved setting from problemDisplayContainer: ",
          solvedProblems
        );
        localStorage.setItem("solved", JSON.stringify(solvedProblems));
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  }, [loadSolvedTickMark]);

  const submitCode = async () => {
    codingDiv.current.scrollTop = 0;

    setIsLoadingSubmit(true);
    dispatch(setIsSubmitted(true));
    setTestCaseOutput([]);
    dispatch(addAllOutput([]));
    setTestCaseResult([]);
    dispatch(addAllResult([]));

    function attemptsReducer() {
      let updatedAttempts = [...attempts];
      updatedAttempts[problemObj.number - 1] =
        (updatedAttempts[problemObj.number - 1] || 0) + 1;
      dispatch(setStoreAttempts(updatedAttempts));
      console.log("Updated attempts: ", updatedAttempts);

      localStorage.setItem("userAttempts", JSON.stringify(updatedAttempts));

      axios
        .post(`${VITE_BACKEND_URL}/userAttempts`, {
          userEmail: localStorage.getItem("email"),
          attempts: updatedAttempts || [],
        })
        .then((res) => {})
        .catch((res) => {});
    }
    attemptsReducer();

    let returnToPrintCode = "";

    const runAllCases = async () => {
      let caseCorrectArr = [];
      for (let i = 0; i < problemObj.cases.length; i++) {
        let sourceCode = editorRef.current.getValue();
        if (!sourceCode) return;
        try {
          if (problemObj.returnType === "linkedlist") {
            if (problemObj.language === "javascript") {
              returnToPrintCode = `
              function ListNode(val) {
                  this.val = val;
                  this.next = null;
              }
          
              function linkedListToArray(head) {
                  const result = [];
                  let current = head;
                  while (current) {
                      result.push(current.val);
                      current = current.next;
                  }
                  return result;
              }
          
              function arrayToLinkedList(arr) {
                  if (!arr.length) return null;
                  let head = new ListNode(arr[0]);
                  let current = head;
                  for (let i = 1; i < arr.length; i++) {
                      current.next = new ListNode(arr[i]);
                      current = current.next;
                  }
                  return head;
              }
          
              const linkedList = arrayToLinkedList(${problemObj.cases[i].parameter});
              const result = ${problemObj.functionName}(linkedList);
              console.log(linkedListToArray(result));
              `;
              sourceCode += returnToPrintCode;
            } else if (problemObj.language === "python") {
              let start = `
class ListNode:
  def __init__(self, val=0, next=None):
    self.val = val
    self.next = next
      
`;
              start = start + sourceCode;
              let mid = `

def linkedListToArray(head):
  result = []
  current = head
  while current:
      result.append(current.val)
      current = current.next
  return result

def arrayToLinkedList(arr):
  if not arr:
      return None
  head = ListNode(arr[0])
  current = head
  for i in range(1, len(arr)):
      current.next = ListNode(arr[i])
      current = current.next
  return head

# Added 'Solution' prefix to the function call
solution = Solution()
linkedList = arrayToLinkedList(${problemObj.cases[i].parameter})
result = solution.${problemObj.functionName}(linkedList)  # Added 'solution.' prefix
print(linkedListToArray(result))
  `;
              sourceCode = start + mid;
            } else if (problemObj.language === "java") {
              returnToPrintCode = `
  import java.util.*;
  
  public class Solution {
      public ListNode arrayToLinkedList(int[] arr) {
          if (arr.length == 0) return null;
          ListNode head = new ListNode(arr[0]);
          ListNode current = head;
          for (int i = 1; i < arr.length; i++) {
              current.next = new ListNode(arr[i]);
              current = current.next;
          }
          return head;
      }
  
      public int[] linkedListToArray(ListNode head) {
          List<Integer> result = new ArrayList<>();
          ListNode current = head;
          while (current != null) {
              result.add(current.val);
              current = current.next;
          }
          return result.stream().mapToInt(Integer::intValue).toArray();
      }
  
      ${sourceCode}
  
      public static void main(String[] args) {
          Solution solution = new Solution();
          int[] arr = {${problemObj.cases[i].parameter.substring(
            1,
            problemObj.cases[i].parameter.length - 1
          )}};
          ListNode linkedList = solution.arrayToLinkedList(arr);
          ListNode result = solution.${problemObj.functionName}(linkedList);
          int[] arrayResult = solution.linkedListToArray(result);
          System.out.println(Arrays.toString(arrayResult));
      }
  }
  class ListNode {
    int val;
    ListNode next;
  
    ListNode(int val) {
        this.val = val;
        this.next = null;
    }
  }
              `;
              sourceCode = returnToPrintCode;
            }
          } else {
            if (problemObj.language === "java") {
              if (problemObj.returnType === "array") {
                let startCode = `import java.util.*;\npublic class Main{\n\npublic static void main(String[] args){\n\t
                int[] result = ${problemObj.cases[i].javaFuncCall}
  
                  System.out.print('[');
                  for(int i=0; i<result.length; i++){
                    System.out.print(result[i]);
                      if(i != result.length-1){
                        System.out.print(',');
                      }
                    }
                  System.out.print(']');
    
                \n}`;

                sourceCode = startCode + sourceCode + "\n}";
              } else if (problemObj.returnType === "matrix") {
                let startCode = `import java.util.*;\npublic class Main{\n\npublic static void main(String[] args){\n\t
                int[][] result = ${problemObj.cases[i].javaFuncCall}
  
                System.out.print('[');
                for(int i = 0; i < result.length; i++) {
                    System.out.print('[');
                    for(int j = 0; j < result[i].length; j++) {
                        System.out.print(result[i][j]);
                        if(j != result[i].length - 1) {
                            System.out.print(',');
                        }
                    }
                    System.out.print(']');
                    if(i != result.length - 1) {
                        System.out.print(',');
                    }
                }
                System.out.print(']');
    
                \n}`;

                sourceCode = startCode + sourceCode + "\n}";
              } else {
                let startCode = `import java.util.*;\npublic class Main{\n\npublic static void main(String[] args){\n\t
                System.out.println(${problemObj.cases[i].javaFuncCall}); \n}`;
                sourceCode = startCode + sourceCode + "\n}";
              }
            } else if (problemObj.language === "javascript") {
              returnToPrintCode = `\nconsole.log(${problemObj.functionName}(${problemObj.cases[i].parameter}));`;
              sourceCode += returnToPrintCode;
            } else if (problemObj.language === "python") {
              returnToPrintCode = `\n\nprint(${problemObj.functionName}(${problemObj.cases[i].parameter}))`;
              sourceCode += returnToPrintCode;
            }
          }

          const { run: result } = await executeCode(language, sourceCode);

          let expectedOutput = String(
            problemObj.cases[i].expectedOutput
          ).replace(/\s/g, "");

          let userOutput = String(result.output.split("\n"))
            .replace(/\s/g, "")
            .slice(0, -1);

          if (
            problemObj.language === "java" &&
            (problemObj.returnType === "array" ||
              problemObj.returnType === "matrix")
          ) {
            userOutput += "]";
          }

          let isTestCaseCorrect = expectedOutput === userOutput;
          setTestCaseResult((prev) => [...prev, isTestCaseCorrect]);
          caseCorrectArr.push(isTestCaseCorrect);

          setTestCaseOutput((prev) => [
            ...prev,
            ...result.output.split("\n").filter((value) => value !== ""),
          ]);

          result.stderr ? setIsError(true) : setIsError(false);
        } catch (error) {
          console.log(error);
          toast({
            title: "An error occurred.",
            description: error.message || "Unable to run code",
            status: "error",
            duration: 6000,
          });
        }
      }

      return caseCorrectArr;
    };

    let caseCorrectArr = await runAllCases();
    let allCorrect = false;
    if (Array.isArray(caseCorrectArr)) {
      allCorrect = caseCorrectArr.every((e) => e === true);
    }

    if (allCorrect) {
      setLoadSolvedTickMark((prev) => !prev);

      let solvedArr = [];
      let attemptsArr = JSON.parse(localStorage.getItem("attempts")) || [];
      AllquesObject.map((que) => {
        if (
          attemptsArr[que.number - 1] !== 0 ||
          que.number === problemObj.number ||
          solvedProblems[que.number - 1]
        ) {
          solvedArr.push(true);
        } else {
          solvedArr.push(false);
        }
      });

      // dispatch(setSolvedProblems([...solvedArr]));
      // console.log("solved setting from CodingPage: ", [...solvedArr]);
      // // localStorage.setItem("solved", JSON.stringify([...solvedArr]));

      let emailVal = localStorage.getItem("email");
      let instaVal = localStorage.getItem("insta");
      let githubVal = localStorage.getItem("github");
      let linkedinVal = localStorage.getItem("linkedin");

      await axios
        .post(`${VITE_BACKEND_URL}/addProblemRecord`, {
          userEmail: emailVal,
          userInsta: instaVal,
          userGithub: githubVal,
          userLinkedin: linkedinVal,
          problemObj: problemObj,
          userImage: userImage.split("/").pop().split(".")[0],
        })
        .then((response) => {})
        .catch((error) => {
          console.error("Error adding problem record:", error);
        });
    }

    dispatch(addAllResult([]));
    setIsLoadingSubmit(false);
  };

  useEffect(() => {
    setUserImage(localStorage.getItem("userImage") || images.accDefaultLogo);
  }, []);

  useEffect(() => {
    let solvedArr = [];
    try {
      const storedSolved = localStorage.getItem("solved");
      if (storedSolved) {
        solvedArr = JSON.parse(storedSolved);
      }
    } catch (e) {
      console.error("Failed to parse 'solved' from localStorage", e);
    }
    dispatch(setSolvedProblems(Array.isArray(solvedArr) ? solvedArr : []));
  }, []);

  useEffect(() => {
    dispatch(addTestCaseOutput(testCaseOutput));
  }, [testCaseOutput]);

  useEffect(() => {
    dispatch(addTestCaseResults(testCaseResult));
  }, [testCaseResult]);

  const runCode = async () => {
    setAllOutput([]);
    dispatch(addAllOutput([]));
    setAllResult([]);
    dispatch(addAllResult([]));

    let returnToPrintCode = "";

    for (let i = 0; i < problemObj.example.length; i++) {
      let sourceCode = editorRef.current.getValue();
      if (!sourceCode) return;
      try {
        if (problemObj.returnType === "linkedlist") {
          if (problemObj.language === "javascript") {
            returnToPrintCode = `
            function ListNode(val) {
                this.val = val;
                this.next = null;
            }
        
            function linkedListToArray(head) {
                const result = [];
                let current = head;
                while (current) {
                    result.push(current.val);
                    current = current.next;
                }
                return result;
            }
        
            function arrayToLinkedList(arr) {
                if (!arr.length) return null;
                let head = new ListNode(arr[0]);
                let current = head;
                for (let i = 1; i < arr.length; i++) {
                    current.next = new ListNode(arr[i]);
                    current = current.next;
                }
                return head;
            }
        
            const linkedList = arrayToLinkedList(${problemObj.example[i].parameter});
            const result = ${problemObj.functionName}(linkedList);
            console.log(linkedListToArray(result));
            `;
            sourceCode += returnToPrintCode;
          } else if (problemObj.language === "python") {
            let start = `
class ListNode:
  def __init__(self, val=0, next=None):
    self.val = val
    self.next = next
        
`;
            start = start + sourceCode;

            let mid = `

def linkedListToArray(head):
    result = []
    current = head
    while current:
        result.append(current.val)
        current = current.next
    return result

def arrayToLinkedList(arr):
    if not arr:
        return None
    head = ListNode(arr[0])
    current = head
    for i in range(1, len(arr)):
        current.next = ListNode(arr[i])
        current = current.next
    return head

# Added 'Solution' prefix to the function call
solution = Solution()
linkedList = arrayToLinkedList(${problemObj.example[i].parameter})
result = solution.${problemObj.functionName}(linkedList)  # Added 'solution.' prefix
print(linkedListToArray(result))
`;
            sourceCode = start + mid;
          } else if (problemObj.language === "java") {
            returnToPrintCode = `
import java.util.*;

public class Solution {
    public ListNode arrayToLinkedList(int[] arr) {
        if (arr.length == 0) return null;
        ListNode head = new ListNode(arr[0]);
        ListNode current = head;
        for (int i = 1; i < arr.length; i++) {
            current.next = new ListNode(arr[i]);
            current = current.next;
        }
        return head;
    }

    public int[] linkedListToArray(ListNode head) {
        List<Integer> result = new ArrayList<>();
        ListNode current = head;
        while (current != null) {
            result.add(current.val);
            current = current.next;
        }
        return result.stream().mapToInt(Integer::intValue).toArray();
    }

    ${sourceCode}

    public static void main(String[] args) {
        Solution solution = new Solution();
        int[] arr = {${problemObj.example[i].parameter.substring(
          1,
          problemObj.example[i].parameter.length - 1
        )}};
        ListNode linkedList = solution.arrayToLinkedList(arr);
        ListNode result = solution.${problemObj.functionName}(linkedList);
        int[] arrayResult = solution.linkedListToArray(result);
        System.out.println(Arrays.toString(arrayResult));
    }
}
class ListNode {
  int val;
  ListNode next;

  ListNode(int val) {
      this.val = val;
      this.next = null;
  }
}
            `;
            sourceCode = returnToPrintCode;
          }
        } else {
          if (problemObj.language === "java") {
            if (problemObj.returnType === "array") {
              let startCode = `import java.util.*;\npublic class Main{\n\npublic static void main(String[] args){\n\t
                int[] result = ${problemObj.example[i].javaFuncCall}
  
                  System.out.print('[');
                  for(int i=0; i<result.length; i++){
                    System.out.print(result[i]);
                      if(i != result.length-1){
                        System.out.print(',');
                      }
                    }
                  System.out.print(']');
    
                \n}`;

              sourceCode = startCode + sourceCode + "\n}";
            } else if (problemObj.returnType === "matrix") {
              let startCode = `import java.util.*;\npublic class Main{\n\npublic static void main(String[] args){\n\t
                int[][] result = ${problemObj.example[i].javaFuncCall}
  
                System.out.print('[');
                for(int i = 0; i < result.length; i++) {
                    System.out.print('[');
                    for(int j = 0; j < result[i].length; j++) {
                        System.out.print(result[i][j]);
                        if(j != result[i].length - 1) {
                            System.out.print(',');
                        }
                    }
                    System.out.print(']');
                    if(i != result.length - 1) {
                        System.out.print(',');
                    }
                }
                System.out.print(']');
    
                \n}`;

              sourceCode = startCode + sourceCode + "\n}";
            } else {
              let startCode = `import java.util.*;\npublic class Main{\n\npublic static void main(String[] args){\n\t
                System.out.println(${problemObj.example[i].javaFuncCall}); \n}`;
              sourceCode = startCode + sourceCode + "\n}";
            }
          } else {
            if (problemObj.language === "javascript") {
              returnToPrintCode = `\nconsole.log(${problemObj.functionName}(${problemObj.example[i].parameter}));`;
              sourceCode += returnToPrintCode;
            } else if (problemObj.language === "python") {
              returnToPrintCode = `\n\nprint(${problemObj.functionName}(${problemObj.example[i].parameter}))`;
              sourceCode += returnToPrintCode;
            }
          }
        }

        setIsLoading(true);
        const { run: result } = await executeCode(language, sourceCode);

        let expectedOutput = String(problemObj.example[i].output).replace(
          /\s/g,
          ""
        );
        let userOutput = String(result.output.split("\n"))
          .replace(/\s/g, "")
          .slice(0, -1);

        if (
          problemObj.language === "java" &&
          (problemObj.returnType === "array" ||
            problemObj.returnType === "matrix")
        ) {
          userOutput += "]";
        }

        if (expectedOutput == userOutput) {
          setAllResult((prev) => [...prev, true]);
        } else {
          setAllResult((prev) => [...prev, false]);
        }
        setOutput(result.output.split("\n"));

        setAllOutput((prev) => [
          ...prev,
          ...result.output.split("\n").filter((value) => value !== ""),
        ]);

        result.stderr ? setIsError(true) : setIsError(false);
      } catch (error) {
        console.log(error);
        toast({
          title: "An error occurred.",
          description: error.message || "Unable to run code",
          status: "error",
          duration: 6000,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    dispatch(addAllOutput(allOutput));
  }, [allOutput]);

  useEffect(() => {
    dispatch(addAllResult(allResult));
  }, [allResult]);

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const onSelect = (language) => {
    setLanguage(language);
    dispatch(addLanguage(language));
    if (language === "javascript") {
      setValue(problemObj.javascriptDefaultCode);
    } else if (language === "python") {
      setValue(problemObj.pythonDefaultCode);
    } else {
      setValue(problemObj.javaDefaultCode);
    }
  };

  return (
    <div className="codingPageBox">
      <Navbar fontColor="white" />
      <div className="codingContainer" ref={codingDiv}>
        <CodeInfoContainer isLoadingSubmit={isLoadingSubmit} />
        <div>
          <CodeHeader
            submitCode={submitCode}
            onSelect={onSelect}
            isLoading={isLoading}
            isLoadingSubmit={isLoadingSubmit}
            runCode={runCode}
            language={language}
            value={value}
            setValue={setValue}
          />
          <CodeEditor
            language={language}
            onSelect={onSelect}
            onMount={onMount}
            value={value}
            setValue={setValue}
          />
          <Output
            output={output}
            isLoading={isLoading}
            isError={isError}
            runCode={runCode}
          />
        </div>
      </div>
    </div>
  );
}

export default CodingPage;
