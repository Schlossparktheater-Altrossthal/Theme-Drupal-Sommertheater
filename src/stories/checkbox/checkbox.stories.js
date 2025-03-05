import twingStory from '../../common/twingStory.js';
import checkbox from './checkbox.twig';
import '../../main.css';

// Story definition
export default {
    title: 'Forms/Checkbox',
    component: 'Checkbox',
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        id: {
            control: 'text',
            description: 'The html id of the checkbox input element.',
        },
        label: {
            control: 'text',
            description: 'The label of the checkbox.',
        },
        subtext: {
            control: 'text',
            description: 'Helptext for a checkbox.',
        },
        disabled: {
            control: 'boolean',
            description: 'Applies disabled styling.',
        },
    },
    args: {
        id: 'checkbox-1',
        label: 'Checkbox label text',
        subtext: '',
    },
};

export const Checkbox = twingStory(checkbox);
