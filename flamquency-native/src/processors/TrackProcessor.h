#pragma once

#include <JuceHeader.h>

class TrackProcessor : public juce::AudioProcessor
{
public:
    TrackProcessor(int numInputs, int numOutputs);
    ~TrackProcessor() override = default;

    // AudioProcessor overrides
    const juce::String getName() const override { return "TrackProcessor"; }
    void prepareToPlay(double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;
    void processBlock(juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    bool isBusesLayoutSupported(const BusesLayout& layouts) const override;
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    // State
    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram(int) override {}
    const juce::String getProgramName(int) override { return {}; }
    void changeProgramName(int, const juce::String&) override {}
    void getStateInformation(juce::MemoryBlock&) override {}
    void setStateInformation(const void*, int) override {}

    juce::AudioParameterFloat* gainParam { nullptr };
    juce::AudioParameterFloat* panParam { nullptr };
    juce::AudioParameterBool* muteParam { nullptr };
    juce::AudioParameterBool* soloParam { nullptr };

private:
    juce::dsp::Gain<float> gain;
    juce::dsp::Panner<float> panner;
};

