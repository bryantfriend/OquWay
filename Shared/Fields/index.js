/**
 * Shared/Fields/index.js
 * Field system bootstrap & exports
 */

import FieldRegistry from './FieldRegistry.js';

import ObjectField from './ObjectField.js';
import ArrayField from './ArrayField.js';

import TextField from './TextField.js';
import NumberField from './NumberField.js';
import BooleanField from './BooleanField.js';
import SelectField from './SelectField.js';
import SliderField from './SliderField.js';
import RangeField from './RangeField.js';
import ImageField from './ImageField.js';
import SlideListField from './SlideListField.js';
import LocalizedTextField from './LocalizedTextField.js';
import TextAreaField from './TextAreaField.js';
import SectionField from './SectionField.js';


import UnknownField from './UnknownField.js';

/* ======================================================
   REGISTRATION ORDER MATTERS
   - Containers first (object / array)
   - Primitives next
   - Fallback last
====================================================== */

// Core structural fields
FieldRegistry.register(ObjectField);
FieldRegistry.register(ArrayField);

// Primitive fields
FieldRegistry.register(TextField);
FieldRegistry.register(NumberField);
FieldRegistry.register(RangeField);
FieldRegistry.register(BooleanField);
FieldRegistry.register(SelectField);
FieldRegistry.register(SliderField);
FieldRegistry.register(ImageField);
FieldRegistry.register(SlideListField);
FieldRegistry.register(LocalizedTextField);
FieldRegistry.register(TextAreaField);
FieldRegistry.register(SectionField);

// Fallback (MUST be last)
FieldRegistry.register(UnknownField);

/* ======================================================
   EXPORTS
====================================================== */

export default FieldRegistry;

export {
   FieldRegistry,
   ObjectField,
   ArrayField,
   TextField,
   NumberField,
   BooleanField,
   SelectField,
   SliderField,
   ImageField,
   SlideListField,
   LocalizedTextField,
   TextAreaField,
   UnknownField
};
