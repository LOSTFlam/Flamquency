#include "Metronome.h"

void Metronome::prepare(double newSampleRate, int newBlockSize)
{
    sampleRate = newSampleRate;
    blockSize = newBlockSize;
}

void Metronome::setEnabled(bool isEnabled)
{
    enabled = isEnabled;
}

void Metronome::setLevel(float levelDb)
{
    levelLin = juce::Decibels::decibelsToGain(levelDb);
}

void Metronome::setBpm(double newBpm)
{
    bpm = newBpm;
}

void Metronome::setSubdivision(int beats, int subdiv)
{
    beatsPerBar = beats;
    subdivision = subdiv;
}

void Metronome::process(juce::AudioBuffer<float>& buffer, int numSamples)
{
    if (!enabled) return;

    const double secondsPerBeat = 60.0 / bpm;
    const double samplesPerSubdivision = (secondsPerBeat / subdivision) * sampleRate;

    for (int sample = 0; sample < numSamples; ++sample)
    {
        const int channelCount = buffer.getNumChannels();
        if (phase >= samplesPerSubdivision)
        {
            for (int ch = 0; ch < channelCount; ++ch)
                buffer.addSample(ch, sample, levelLin);
            phase -= samplesPerSubdivision;
        }
        phase += 1.0;
    }
}

