#include "TrackProcessor.h"

TrackProcessor::TrackProcessor(int numInputs, int numOutputs)
    : AudioProcessor(BusesProperties()
                         .withInput("Input", juce::AudioChannelSet::canonicalChannelSet(numInputs), true)
                         .withOutput("Output", juce::AudioChannelSet::canonicalChannelSet(numOutputs), true))
{
    addParameter(gainParam = new juce::AudioParameterFloat("gain", "Gain", 0.0f, 2.0f, 1.0f));
    addParameter(panParam = new juce::AudioParameterFloat("pan", "Pan", -1.0f, 1.0f, 0.0f));
    addParameter(muteParam = new juce::AudioParameterBool("mute", "Mute", false));
    addParameter(soloParam = new juce::AudioParameterBool("solo", "Solo", false));
}

void TrackProcessor::prepareToPlay(double sampleRate, int samplesPerBlock)
{
    juce::dsp::ProcessSpec spec { sampleRate, (juce::uint32) samplesPerBlock, (juce::uint32) getMainBusNumOutputChannels() };
    gain.prepare(spec);
    panner.prepare(spec);
}

void TrackProcessor::releaseResources()
{
}

void TrackProcessor::processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midi)
{
    juce::ignoreUnused(midi);

    if (muteParam->get())
    {
        buffer.clear();
        return;
    }

    gain.setGainLinear(gainParam->get());
    panner.setPan(panParam->get());

    juce::dsp::AudioBlock<float> block(buffer);
    juce::dsp::ProcessContextReplacing<float> ctx(block);
    panner.process(ctx);
    gain.process(ctx);
}

bool TrackProcessor::isBusesLayoutSupported(const BusesLayout& layouts) const
{
    return layouts.getMainInputChannelSet() == layouts.getMainOutputChannelSet();
}

