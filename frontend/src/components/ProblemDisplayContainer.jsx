import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addProblemObj } from "../store/problemObjSlice";
import { Link } from "react-router-dom";
import { images } from "../javascripts/images";
import "../style/problemBoxContainer.scss";
import { AllquesObject } from "../javascripts/data";
import { addTestCaseResults } from "../store/problemObjSlice";
import axios from "axios";
import crtImage from "../assets/icons/correctIcon.png";
import CorrectIcon from "./CorrectIcon";

const ProblemDisplayContainer = ({
  problem,
  value,
  fontSize,
  bool,
  index,
  isGapSmall,
}) => {
  const dispatch = useDispatch();
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const attemptsStore = useSelector((state) => state.attempts.attempts);

  const attempts =
    attemptsStore || JSON.parse(localStorage.getItem("userAttempts")) || [];

  const handleClick = () => {
    if (bool === true) {
      var currSelectedLanguage = "";
      const language = useSelector((state) => state.language.selectedLanguage);
      if (language === "js") {
        currSelectedLanguage = jsAllQuesObj;
      } else if (language === "python") {
        currSelectedLanguage = pythonAllQuesObj;
      } else {
        currSelectedLanguage = javaAllQuesObj;
      }

      const selectedProblem = currSelectedLanguage.find(
        (item) => item.heading === problem.heading
      );
      dispatch(addProblemObj(selectedProblem));
    } else {
      const selectedProblem = AllquesObject.find(
        (item) => item.heading === problem.heading
      );
      dispatch(addProblemObj(selectedProblem));
    }
  };

  const isSolved = (number) => {
    const solved = JSON.parse(localStorage.getItem("solved"));
    return solved ? solved[number] : false;
  };

  const getAttempts = (number) => {
    return attempts[number - 1] || 0;
  };

  return (
    <Link
      to="/coding"
      onClick={handleClick}
      className="problemDisplayer"
      style={{ fontSize: fontSize }}
    >
      <div className="problemBoxContainer">
        <div className="problemBoxPart1">
          {value && (
            <>
              <div className="statusContainer">
                {isSolved(problem.number) ? (
                  <img
                    className="solvedIcons"
                    src={crtImage}
                    alt="correctImg"
                  />
                ) : (
                  <p className="notSolved"></p>
                )}
              </div>
              <div className="numberdisplayer">
                <p>{problem.number}.</p>
              </div>
            </>
          )}
          <p>{problem.heading}</p>
        </div>
        {value && (
          <div
            className={
              isGapSmall
                ? "problemBoxPart2Margin problemBoxPart2"
                : "problemBoxPart2"
            }
          >
            <div className="problemBoxMiddle">
              <div className="topicsDisplayer">
                <span className="topics">Topics: </span>
                <span className="problemTopics">{problem.ds}</span>
              </div>
            </div>
            <div className="difficultyDisplayer">
              {problem.difficulty === "Easy" ? (
                <p style={{ color: "#1CBABA" }}>{problem.difficulty}</p>
              ) : problem.difficulty === "Medium" ? (
                <p style={{ color: "#FFB700" }}>{problem.difficulty}</p>
              ) : (
                <p style={{ color: "#F63737" }}>{problem.difficulty}</p>
              )}
            </div>
            <div className="attempts">
              <p>{getAttempts(problem.number)}</p>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProblemDisplayContainer;
