#include "Transport.h"

TransportController::TransportController()
{
    startTimer(1); // 1 ms resolution for position updates
}

TransportController::~TransportController()
{
    stopTimer();
}

void TransportController::play()
{
    playing.store(true);
    cachedInfo.isPlaying = true;
}

void TransportController::stop()
{
    playing.store(false);
    cachedInfo.isPlaying = false;
}

void TransportController::record()
{
    playing.store(true);
    cachedInfo.isRecording = true;
}

void TransportController::setPosition(double seconds, bool forceJump)
{
    juce::ignoreUnused(forceJump);
    cachedInfo.timeInSeconds = seconds;
    cachedInfo.timeInSamples = seconds * 48000.0;
    currentPositionSamples.store((juce::int64) cachedInfo.timeInSamples);
}

void TransportController::setLoop(double start, double end)
{
    loopStart = start;
    loopEnd = end;
    cachedInfo.isLooping = true;
}

void TransportController::setTempo(double bpm)
{
    cachedInfo.bpm = bpm;
}

TransportController::TimeInfo TransportController::getTimeInfo() const
{
    return cachedInfo;
}

void TransportController::addListener(juce::ChangeListener* listener)
{
    listeners.add(listener);
}

void TransportController::removeListener(juce::ChangeListener* listener)
{
    listeners.remove(listener);
}

void TransportController::hiResTimerCallback()
{
    if (!playing.load())
        return;

    // Simple linear time advance; tempo map is a TODO
    const double samplesPerMs = 48.0; // assuming 48k, adjust later
    cachedInfo.timeInSamples += samplesPerMs;
    cachedInfo.timeInSeconds = cachedInfo.timeInSamples / 48000.0;
    currentPositionSamples.store((juce::int64) cachedInfo.timeInSamples);

    // Loop handling
    if (cachedInfo.isLooping && loopEnd > loopStart && cachedInfo.timeInSeconds >= loopEnd)
    {
        cachedInfo.timeInSeconds = loopStart;
        cachedInfo.timeInSamples = loopStart * 48000.0;
        currentPositionSamples.store((juce::int64) cachedInfo.timeInSamples);
    }

    listeners.call([](juce::ChangeListener& l) { l.changeListenerCallback(nullptr); });
}

