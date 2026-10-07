# Describing uploads

When people turn describing on, a language model describes and labels each file they upload. Reactions call `Reasoning.prompt` with questions about the file, and an agent takes each question and writes the answer through endpoints, as a person acts through the browser. No reaction here calls a model. With [labels](labels.md), the owner can remove a wrong label and find files by label.

## Choosing

The agent sends each file it reads to the model's provider, so the reactions call `Reasoning.prompt` for a person's files only after that person turns describing on. A person [turns describing on](reaction:describing.choosing.TurnOn) or [off](reaction:describing.choosing.TurnOff) with the "Describe uploads" switch, and Consenting records the choice under the use `describe-uploads`. Whether someone has describing on is one yes-or-no question, and you'll find it here as both a view and a former. The view [has describing on](view:describing.choosing.describingOn) is a condition in each reaction and endpoint below that calls `Reasoning.prompt`. The box shows the switch on or off, and an endpoint can respond with a former but not a view, so the former [whether the user has describing on](former:describing.choosing.describingSetting) reads the same consent for the box. When a person turns describing off, a reaction [abandons their questions that no reasoner has taken yet](reaction:describing.choosing.AbandonWhenTurnedOff), so the agent never sends those files; if the agent is already writing an answer, it finishes that one.

```endpoints
describing.choosing.TurnOn at /describing/on
describing.choosing.TurnOff at /describing/off
```

## Asking

When Storing finishes an upload and the uploader has describing on, a reaction [prompts for a short description](reaction:describing.asking.AskForDescription), and another [prompts for labels](reaction:describing.asking.AskForLabels), one per line. They are separate reactions because each is its own consequence of a finished upload, and you can change one without touching the other. If a description or the labels are missing or wrong, the owner can ask again: [describe the file again](reaction:describing.asking.DescribeAgain), or [suggest labels again](reaction:describing.asking.SuggestLabelsAgain). While a question with the same wording about the file is still waiting or being answered, [the open-question view](view:describing.asking.hasOpenQuestion) holds, and the endpoint responds without asking again, so a double click or a script can't queue the same question many times. When the owner asks for a new description, their labels stay as they are. On both endpoints, anyone but the owner is refused with `NOT_FOUND`, and an owner without describing on is refused with `NOT_CONSENTED`.

```endpoints
describing.asking.DescribeAgain at /files/describe
describing.asking.SuggestLabelsAgain at /files/relabel
```

The reaction that applies labels, the former that returns descriptions, and the describer match each question by its exact wording. If you reword a question, they no longer match the answers to the old wording, and prompts still waiting under the old wording go unanswered.

## Reading

The describer, defined in `src/agents/describer.ts`, takes each question and writes its answer through the endpoints in [answering questions](reusable/answering.md). To answer, it needs the file. [The file endpoint](reaction:describing.reading.ReadFile) starts with `AgentSessioning.use`, so a person's session is refused, and returns the name, media type, and download link of the file a prompt is about, only for a prompt the agent took. The where clause matches the file through `Reasoning._taken`, so the agent can't read any other file. A prompt the agent didn't take is refused with `NOT_TAKEN`. When the file is no longer stored, the endpoint responds with `FILE_NOT_FOUND`, and the agent abandons the question with the reason "This file is no longer stored."

```endpoints
describing.reading.ReadFile at /describing/file
```

## Applying answers

When a reasoner concludes the label question and the file is still stored, a reaction [labels the file once for each of the first five lines of the answer](reaction:describing.applying.LabelFromAnswer). The reaction compares the concluded prompt's ask with the label question's wording, and ignores lines after the fifth, so a file gets at most five labels however many lines the model writes. A line that is too long or already a label of the file is refused, and the reaction skips it. The description has no reaction; the box endpoint reads it from Reasoning while the model writes it and after the model concludes. When Storing deletes a file, a reaction in [labels](labels.md) removes every label of that file, and a reaction here [forgets every question about it](reaction:describing.forgetting.ForgetQuestionsOfDeleted), with its answers, so a model's description of a file doesn't outlive the file.

## Showing

[My files](box.md) includes, for each file, [its descriptions and labels](former:describing.showing.describingOf): every description with its stage, and the reason if someone abandoned it (the screen shows the latest one); every label question with its stage and any reason; the file's labels; and how many of its questions are still waiting or forming. The screen refreshes every second while that count is above zero.
