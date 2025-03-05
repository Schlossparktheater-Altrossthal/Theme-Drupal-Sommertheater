// Import the YAML metadata and the Twig template.
import calloutMetadata from './callout.component.yml';
import calloutTemplate from './callout.twig';
import './callout.css';
import twingStory from '../../src/common/twingStory.js';
import generateArgTypesAndArgs from '../../src/common/generateArgTypesAndArgs.js';


const { argTypes, args } = generateArgTypesAndArgs(calloutMetadata);

export default {
    title: 'Components/Callout',
    component: 'Callout',
    argTypes,
    args
};

export const Default = twingStory(calloutTemplate);
