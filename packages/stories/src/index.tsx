import { useRef } from 'react';
import { StoriesContext } from './Contexts';
import { Actions, Progress, Story } from './Components';
import { IStoryProps, IStoryIndexedObject, IStoryContext } from './types';
import { useEffect, useMemo, useState } from 'react';
import * as hooks from './Hooks';
import styles from './styles.css';
import * as utilities from './utilities';

export default function Stories({
  stories = [],
  width = '100%',
  height = '100%',
  progressBarPosition = '',
  onStoryChange = () => {},
  currentIndex = 0,
  defaultDuration = 10000,
  loop = false,
  onAllStoriesEnd = () => {},
  onStoriesStart = () => {},
  classNames = {},
  pauseStoryWhenInActiveWindow = true,
}: IStoryProps): JSX.Element | null {
  const storiesWithIndex: IStoryIndexedObject[] = useMemo(() => {
    return utilities.transformStories(stories, defaultDuration);
  }, [stories, defaultDuration]);

  const [selectedStory, setSelectedStory] = useState<
    IStoryIndexedObject | undefined
  >();
  const firstStoryIndex = 0;
  const lastStoryIndex = stories.length - 1;
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const hasCalledEndedCb = useRef<any>(false);
  const hasCalledStartedCb = useRef<any>(false);

  useEffect(() => {
    if (!hasCalledStartedCb.current) {
      hasCalledStartedCb.current = true;
      onStoriesStart();
    }
  }, [onStoriesStart]);

  useEffect(() => {
    const story = storiesWithIndex[currentIndex];
    if (story) {
      setSelectedStory(story);
    }
  }, [currentIndex, stories]);

  function handleNextClick() {
    if (loop && selectedStory?.index === lastStoryIndex) {
      setSelectedStory(storiesWithIndex[firstStoryIndex]);
      return;
    }
    if (!hasCalledEndedCb.current && selectedStory?.index === lastStoryIndex) {
      onAllStoriesEnd();
      hasCalledEndedCb.current = true;
    }
    if (selectedStory?.index === lastStoryIndex) {
      return;
    }
    setSelectedStory((prev) => {
      if (!prev) {
        return storiesWithIndex[0];
      }
      const newIndex = prev?.index + 1;
      return storiesWithIndex[newIndex];
    });
  }
  function handlePrevClick() {
    if (selectedStory?.index === firstStoryIndex) {
      return;
    }
    setSelectedStory((prev) => {
      if (!prev) {
        return storiesWithIndex[0];
      }
      const newIndex = prev?.index - 1;
      return storiesWithIndex[newIndex];
    });
  }

  function handlePause() {
    setIsPaused(true);
  }
  function handleResume() {
    setIsPaused(false);
  }

  useEffect(() => {
    if (selectedStory) {
      onStoryChange(selectedStory.index);
    }
  }, [selectedStory]);

  hooks.usePausableTimeout(
    () => {
      handleNextClick();
    },
    selectedStory?.calculatedDuration ?? null,
    isPaused,
  );

  hooks.useWindowVisibility((isWindowInFocus) => {
    if (pauseStoryWhenInActiveWindow) {
      setIsPaused(!isWindowInFocus);
    }
  });

  const contextValue: IStoryContext = {
    stories: storiesWithIndex,
    width,
    height,
    defaultDuration,
    isPaused,
    classNames,
  };

  if (!selectedStory) {
    return null;
  }
  return (
    <StoriesContext.Provider value={contextValue}>
      <div
        className={`${styles.main} ${classNames.main || ''}`}
        style={{ width, height }}
      >
        <Progress activeStoryIndex={selectedStory.index} isPaused={isPaused} progressBarPosition={progressBarPosition} />
        <Story
          key={selectedStory.index}
          onPause={handlePause}
          onResume={handleResume}
          story={selectedStory}
          isPaused={isPaused}
        />
        <Actions
          onNextClick={handleNextClick}
          onPrevClick={handlePrevClick}
          onPause={handlePause}
          onResume={handleResume}
        />
      </div>
    </StoriesContext.Provider>
  );
}
