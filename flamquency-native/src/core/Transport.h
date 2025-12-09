#pragma once

#include <JuceHeader.h>

class TransportController : public juce::HighResolutionTimer
{
public:
    TransportController();
    ~TransportController() override;

    struct TimeInfo
    {
        double ppqPosition { 0.0 };
        double ppqPositionOfLastBarStart { 0.0 };
        double timeInSeconds { 0.0 };
        double timeInSamples { 0.0 };
        double bpm { 120.0 };
        int timeSigNumerator { 4 };
        int timeSigDenominator { 4 };
        bool isPlaying { false };
        bool isRecording { false };
        bool isLooping { false };
        juce::int64 hostTimeNs { 0 };
    };

    void play();
    void stop();
    void record();
    void setPosition(double seconds, bool forceJump = false);
    void setLoop(double start, double end);
    void setTempo(double bpm);

    TimeInfo getTimeInfo() const;

    void addListener(juce::ChangeListener* listener);
    void removeListener(juce::ChangeListener* listener);

private:
    void hiResTimerCallback() override;

    double loopStart { 0.0 };
    double loopEnd { 0.0 };

    std::atomic<double> currentPositionSamples { 0 };
    std::atomic<bool> playing { false };

    TimeInfo cachedInfo;
    juce::ListenerList<juce::ChangeListener> listeners;
};

