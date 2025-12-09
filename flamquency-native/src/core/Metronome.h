#pragma once

#include <JuceHeader.h>

class Metronome
{
public:
    void prepare(double sampleRate, int blockSize);
    void process(juce::AudioBuffer<float>& buffer, int numSamples);

    void setEnabled(bool enabled);
    void setLevel(float levelDb);
    void setBpm(double bpm);
    void setSubdivision(int beatsPerBar, int subdivision);

private:
    double sampleRate { 48000.0 };
    int blockSize { 256 };
    bool enabled { false };
    float levelLin { 0.1f };
    double bpm { 120.0 };
    int beatsPerBar { 4 };
    int subdivision { 4 };
    double phase { 0.0 };
};

