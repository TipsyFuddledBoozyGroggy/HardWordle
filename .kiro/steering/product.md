# Product Overview

Hard Wordle is a challenging word-guessing game based on the New York Times Wordle. Players have 6 attempts to guess a randomly selected 5-letter English word, receiving color-coded feedback after each guess.

## Key Differentiator

Unlike the original Wordle which uses a curated list of common words, Hard Wordle accepts any valid 5-letter word from the English language (5000+ words), making it significantly more challenging.

## Game Mechanics

- **Green**: Letter is correct and in the right position
- **Yellow**: Letter is in the word but in the wrong position  
- **Gray**: Letter is not in the word at all
- Only valid 5-letter English words are accepted as guesses
- Game ends when word is guessed correctly or 6 attempts are exhausted

## Deployment

The application is containerized with Docker and deployed on AWS using ECS Fargate with a fully automated CI/CD pipeline. Infrastructure is defined as code using CloudFormation templates.
