<template>
  <div>
    <Qti3Player
      ref="qti3player"
      v-bind:container-class="containerClass"
      v-bind:color-class="colorClass"
      suppress-alert-messages
      suppress-invalid-response-messages
      @notifyQti3PlayerReady="handlePlayerReady"
      @notifyQti3ItemReady="handleItemReady"
      @notifyQti3SuspendAttemptCompleted="handleSuspendAttemptCompleted"
      @notifyQti3EndAttemptCompleted="handleEndAttemptCompleted"
      @notifyQti3ItemAlertEvent="displayItemAlertEvent"
    />
    <button ref="btnPrev" type="button" @click="handlePrevItem" class="btn btn-sm btn-outline-primary">Prev</button>
    <button ref="btnNext" type="button" @click="handleNextItem" class="btn btn-sm btn-outline-primary">Next</button>
</div>
</template>

<script>
import Qti3Player from '@/Qti3Player.vue'
import { PnpFactory } from '@/shared/helpers/PnpFactory'
import { SessionControlFactory } from '@/shared/helpers/SessionControlFactory'
import Swal from 'sweetalert2'

export default {
  name: 'App',

  components: {
    Qti3Player
  },

  data () {
    return {
      isTestStarted: false,
      currentItem: 0,
      items: [
        {
          "identifier": "sbac-200-183300-templated",
          "guid": "0000-0000-0001sbac-templated",
          "xml": `<!-- This example adapted from the Smarter Balanced IRP, copyright Smarter Balanced. -->
      <qti-assessment-item xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"   xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd" identifier="sbac-200-183300-templated" time-dependent="false" title="sbac-200-183300-templated" xml:lang="en">
        <qti-response-declaration base-type="identifier" cardinality="multiple" identifier="RESPONSE">
          <qti-correct-response>
            <qti-value>D</qti-value>
            <qti-value>E</qti-value>
          </qti-correct-response>
        </qti-response-declaration>
        <qti-outcome-declaration base-type="float" cardinality="single" identifier="SCORE" normal-maximum="1.0" normal-minimum="0.0">
          <qti-default-value>
            <qti-value>0</qti-value>
          </qti-default-value>
        </qti-outcome-declaration>
      <qti-outcome-declaration base-type="identifier" cardinality="single" identifier="FEEDBACK" />
      <qti-template-declaration identifier="a" cardinality="single" base-type="integer" math-variable="true" param-variable="true"/>
      <qti-template-declaration identifier="b" cardinality="single" base-type="integer" math-variable="true" param-variable="true"/>
      <qti-template-declaration identifier="c" cardinality="single" base-type="integer" math-variable="true" param-variable="true"/>
      <qti-template-declaration identifier="d" cardinality="single" base-type="integer" math-variable="true" param-variable="true"/>
      <qti-template-processing>
        <qti-set-template-value identifier="a">
          <qti-random-integer min="2" max="20"/>
        </qti-set-template-value>
        <qti-set-template-value identifier="b">
          <qti-random-integer min="3" max="13"/>
        </qti-set-template-value>
        <qti-set-template-value identifier="c">
          <qti-integer-divide>
            <qti-variable identifier="a"/>
            <qti-variable identifier="b"/>
          </qti-integer-divide>
        </qti-set-template-value>
        <qti-set-template-value identifier="d">
          <qti-integer-modulus>
            <qti-variable identifier="a"/>
            <qti-variable identifier="b"/>
          </qti-integer-modulus>
        </qti-set-template-value>
        <qti-template-constraint>
          <qti-and>
            <qti-gt>
              <qti-variable identifier="a"/>
              <qti-variable identifier="b"/>
            </qti-gt>
            <qti-not>
              <qti-equal tolerance-mode="exact">
                <qti-variable identifier="c"/>
                <qti-variable identifier="d"/>
              </qti-equal>
            </qti-not>
            <qti-not>
              <qti-equal tolerance-mode="exact">
                <qti-variable identifier="d"/>
                <qti-base-value base-type="integer">0</qti-base-value>
              </qti-equal>
            </qti-not>
          </qti-and>
        </qti-template-constraint>
      </qti-template-processing>
      <qti-item-body class="" data-catalog-idref="item-183300-global">
        <div class="qti-layout-row">
          <div class="qti-layout-col8 qti-layout-offset2">
            <div class="prompt">
              <strong>sbac-200-183300 <em>with templating</em></strong>
              <hr />
              <p>
                Select <strong>all</strong> values equivalent to <math xmlns="http://www.w3.org/1998/Math/MathML"><mo>-</mo><mfrac bevelled="false"><mi>a</mi><mi>b</mi></mfrac></math>.
              </p>
            </div>
            <qti-choice-interaction class="sbac qti-labels-none" shuffle="true" max-choices="5" min-choices="1" response-identifier="RESPONSE">
              <qti-simple-choice identifier="A">
                <p>
                  <math xmlns="http://www.w3.org/1998/Math/MathML"><mfrac bevelled="false"><mrow><mo>-</mo><mi>a</mi></mrow><mrow><mo>-</mo><mi>b</mi></mrow></mfrac></math>
                </p>
              </qti-simple-choice>
              <qti-simple-choice identifier="B">
                <p>
                  <math xmlns="http://www.w3.org/1998/Math/MathML"><mo>-</mo><mi>d</mi><mfrac bevelled="false"><mi>c</mi><mi>b</mi></mfrac></math>
                </p>
              </qti-simple-choice>
              <qti-simple-choice identifier="C">
                <p>
                  <math xmlns="http://www.w3.org/1998/Math/MathML"><mi>c</mi><mfrac bevelled="false"><mi>d</mi><mi>b</mi></mfrac></math>
                </p>
              </qti-simple-choice>
              <qti-simple-choice identifier="D">
                <p>
                  <math xmlns="http://www.w3.org/1998/Math/MathML"><mo>-</mo><mfrac bevelled="false"><mrow><mo>-</mo><mi>a</mi></mrow><mrow><mo>-</mo><mi>b</mi></mrow></mfrac></math>
                </p>
              </qti-simple-choice>
              <qti-simple-choice identifier="E">
                <p>
                  <math xmlns="http://www.w3.org/1998/Math/MathML"><mo>-</mo><mi>c</mi><mfrac bevelled="false"><mi>d</mi><mi>b</mi></mfrac></math>
                </p>
              </qti-simple-choice>
            </qti-choice-interaction>
          </div>
        </div>
      </qti-item-body>
      <qti-response-processing>
        <qti-response-condition>
          <qti-response-if>
            <qti-match>
              <qti-variable identifier="RESPONSE"/>
              <qti-correct identifier="RESPONSE"/>
            </qti-match>
            <qti-set-outcome-value identifier="SCORE">
              <qti-base-value base-type="float">1</qti-base-value>
            </qti-set-outcome-value>
            <qti-set-outcome-value identifier="FEEDBACK">
              <qti-base-value base-type="identifier">correct</qti-base-value>
            </qti-set-outcome-value>
          </qti-response-if>
          <qti-response-else>
            <qti-set-outcome-value identifier="SCORE">
              <qti-base-value base-type="float">0</qti-base-value>
            </qti-set-outcome-value>
            <qti-set-outcome-value identifier="FEEDBACK">
              <qti-base-value base-type="identifier">incorrect</qti-base-value>
            </qti-set-outcome-value>
          </qti-response-else>
        </qti-response-condition>
      </qti-response-processing>
      <!--
      <qti-modal-feedback outcome-identifier="FEEDBACK" identifier="correct" show-hide="show">
        <qti-content-body>
          <p>Well done!</p>
        </qti-content-body>
      </qti-modal-feedback>
      <qti-modal-feedback outcome-identifier="FEEDBACK" identifier="incorrect" show-hide="show">
        <qti-content-body>
          <p>Sorry, your answer is not correct.</p>
        </qti-content-body>
      </qti-modal-feedback>
      -->
    </qti-assessment-item>`
        },
        {
          "identifier": "q2-choice-interaction-single-cardinality",
          "guid": "0000-0000-0001",
          "xml": `<qti-assessment-item 
          xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
          xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd" 
          identifier="q2-choice-interaction-single-cardinality" title="Q2 - Choice Interaction - Single Cardinality" adaptive="false" time-dependent="false">
          <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
            <qti-correct-response>
              <qti-value>choice_c</qti-value>
            </qti-correct-response>
          </qti-response-declaration>
          <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
            <qti-default-value>
              <qti-value>0.0</qti-value>
            </qti-default-value>
          </qti-outcome-declaration>
          <qti-item-body>
            <qti-choice-interaction response-identifier="RESPONSE" class="" max-choices="0" shuffle="true" min-choices="0">
              <qti-prompt>Select 0 to 1 SimpleChoice below and end the attempt by submitting the response.</qti-prompt>
              <qti-simple-choice identifier="choice_a">choice_a</qti-simple-choice>
              <qti-simple-choice identifier="choice_b">choice_b</qti-simple-choice>
              <qti-simple-choice identifier="choice_c">choice_c</qti-simple-choice>
            </qti-choice-interaction>
          </qti-item-body>

          <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
          </qti-assessment-item>`
        },
        {
          "identifier": "i19b-shared-css-vocab-1",
          "guid": "0000-0004-0001",
          "xml": "<qti-assessment-item xmlns=\"http://www.imsglobal.org/xsd/imsqtiasi_v3p0\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd\" identifier=\"i19b-shared-css-vocab-1\" title=\"i19b Shared CSS Vocabulary 1\" \r\n  time-dependent=\"false\" adaptive=\"false\"><qti-item-body><div>\r\n      <![CDATA[<style>/* These styles not part of shared css */      .muted {color:#999999;font-size:smaller;}      </style>]]><h4>Underline an Element</h4>\r\n\r\n      <p>Look at the <span class=\"qti-underline\">underlined text</span> in this sentence.</p>\r\n\r\n      <h4>Italicize an Element</h4>\r\n\r\n      <p>Look at the <span class=\"qti-italic\">italicized text</span> in this sentence.</p>\r\n    \r\n      <h4>Horizontal Alignment - Left, Center, Right <span class=\"muted\">- table border added for effect</span></h4>\r\n\r\n      <table class=\"qti-fullwidth qti-bordered\">\r\n        <tbody>\r\n          <tr>\r\n            <td class=\"qti-align-left\">I am left-aligned text in a table cell.</td>\r\n          </tr>\r\n          <tr>\r\n            <td class=\"qti-align-center\">I am center-aligned text in a table cell.</td>\r\n          </tr>\r\n          <tr>\r\n            <td class=\"qti-align-right\">I am right-aligned text in a table cell.</td>\r\n          </tr>\r\n        </tbody>\r\n      </table>\r\n    \r\n      <h4>Vertical Alignment - Top, Middle, Baseline, Bottom <span class=\"muted\">- 4x28 images and paragraph borders added for effect</span></h4>\r\n    \r\n      <p class=\"qti-bordered\">\r\n        <img class=\"qti-valign-top\" alt=\"placeholder\" src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAAFUlEQVR42mNkYPhfz4AEGEcFhosAAM7zKeUTvPB1AAAAAElFTkSuQmCC\" hspace=\"4\" vspace=\"0\" width=\"4\" height=\"28\"/>\r\n        I am top-valigned.\r\n      </p>\r\n      <p class=\"qti-bordered\">\r\n        <img class=\"qti-valign-middle\" alt=\"placeholder\" src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAAFUlEQVR42mNkYPhfz4AEGEcFhosAAM7zKeUTvPB1AAAAAElFTkSuQmCC\" hspace=\"4\" vspace=\"0\" width=\"4\" height=\"28\"/>\r\n        I am middle-valigned.\r\n      </p>\r\n      <p class=\"qti-bordered\">\r\n        <img class=\"qti-valign-baseline\" alt=\"placeholder\" src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAAFUlEQVR42mNkYPhfz4AEGEcFhosAAM7zKeUTvPB1AAAAAElFTkSuQmCC\" hspace=\"4\" vspace=\"0\" width=\"4\" height=\"28\"/>\r\n        I am baseline-valigned.\r\n      </p>\r\n      <p class=\"qti-bordered\">\r\n        <img class=\"qti-valign-bottom\" alt=\"placeholder\"  src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAAFUlEQVR42mNkYPhfz4AEGEcFhosAAM7zKeUTvPB1AAAAAElFTkSuQmCC\" hspace=\"4\" vspace=\"0\" width=\"4\" height=\"28\"/>\r\n        I am bottom-valigned.\r\n      </p>\r\n    \r\n      <h4>Make an Element Fullwidth (width=100%) <span class=\"muted\">- table border added for effect</span></h4>\r\n    \r\n      <table class=\"qti-fullwidth qti-bordered\">\r\n        <tbody>\r\n          <tr>\r\n            <td class=\"qti-align-left\">I am left-aligned</td>\r\n          </tr>\r\n          <tr>\r\n            <td class=\"qti-align-center\">I am center-aligned</td>\r\n          </tr>\r\n          <tr>\r\n            <td class=\"qti-align-right\">I am right-aligned</td>\r\n          </tr>\r\n        </tbody>\r\n      </table>\r\n    \r\n      <h4>Add an Element Border <span class=\"muted\">- second paragraph is bordered</span></h4>\r\n    \r\n      <p>\r\n        Ho hum.  I am a non-bordered paragraph.\r\n      </p>\r\n      <p class=\"qti-bordered\">\r\n        Look at me! I am a bordered paragraph.\r\n      </p>\r\n      <p>\r\n        I am yet another non-bordered paragraph.\r\n      </p>\r\n    \r\n      <h4>Place an element in a Well <span class=\"muted\">- second paragraph is in a well</span></h4>\r\n    \r\n      <p>\r\n        Ho hum.  I am a non-bordered paragraph.\r\n      </p>\r\n      <p class=\"qti-well\">\r\n        Look at me! I am in a well!\r\n      </p>\r\n      <p>\r\n        I am yet another non-bordered paragraph.\r\n      </p>\r\n    \r\n    </div>\r\n  </qti-item-body>\r\n</qti-assessment-item>"
        },
        {
          "identifier": "i19b-shared-css-vocab-2",
          "guid": "0000-0004-0002",
          "xml": "<qti-assessment-item \r\n  xmlns=\"http://www.imsglobal.org/xsd/imsqtiasi_v3p0\" \r\n  xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\r\n  xsi:schemaLocation=\"http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd\" \r\n  identifier=\"i19b-shared-css-vocab-2\" title=\"i19b Shared CSS Vocabulary 2\" \r\n  time-dependent=\"false\" adaptive=\"false\"><qti-item-body><div><![CDATA[<style>\r\n      /* Utility CSS to demonstrate column virtual borders - no effect on layout. */\r\n      [class*=\"qti-layout-col\"] {background-color:#eee;}</style>]]><h4>qti-layout-row, qti-layout-col</h4><hr /><br /><div class=\"qti-layout-row\">\r\n        <div class=\"qti-layout-col1\">\r\n          The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col1\">\r\n          The quick brown fox jumps over the lazy dog.\r\n        </div><div class=\"qti-layout-col1\">The quick brown fox jumps over the lazy dog.\r\n        </div><div class=\"qti-layout-col1\">\r\n          The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col1\">\r\n          The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col1\">\r\n          The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col1\">\r\n          The quick brown fox jumps over the lazy dog.</div><div class=\"qti-layout-col1\">The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col1\"> The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col1\">The quick brown fox jumps over the lazy dog.</div><div class=\"qti-layout-col1\">\r\n          The quick brown fox jumps over the lazy dog.\r\n        </div><div class=\"qti-layout-col1\">\r\n          The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n      </div><hr /><div class=\"qti-layout-row\"><div class=\"qti-layout-col2\">The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col2\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col2\">The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col2\">The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col2\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col2\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n      </div>\r\n\r\n      <hr />\r\n\r\n      <div class=\"qti-layout-row\">\r\n        <div class=\"qti-layout-col3\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col3\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col3\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col3\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n      </div>\r\n\r\n      <hr />\r\n\r\n      <div class=\"qti-layout-row\">\r\n        <div class=\"qti-layout-col4\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col4\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col4\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n      </div>\r\n\r\n      <hr />\r\n\r\n      <div class=\"qti-layout-row\">\r\n        <div class=\"qti-layout-col5\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col7\">The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n      </div>\r\n\r\n      <hr />\r\n\r\n      <div class=\"qti-layout-row\">\r\n        <div class=\"qti-layout-col6\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col6\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n      </div>\r\n\r\n      <hr />\r\n\r\n      <div class=\"qti-layout-row\">\r\n        <div class=\"qti-layout-col12\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.</div>\r\n      </div>\r\n\r\n      <hr /><h4>qti-layout-row, qti-layout-col, qti-layout-offset</h4><hr /><div class=\"qti-layout-row\">\r\n        <div class=\"qti-layout-col6 qti-layout-offset3\">The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.</div></div><hr /><div class=\"qti-layout-row\"><div class=\"qti-layout-col4 qti-layout-offset2\">The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.</div><div class=\"qti-layout-col4\">The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.</div></div><hr /><div class=\"qti-layout-row\"><div class=\"qti-layout-col2 qti-layout-offset1\">The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.</div><div class=\"qti-layout-col4 qti-layout-offset1\">The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.</div><div class=\"qti-layout-col2 qti-layout-offset1\">The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.</div></div><hr /></div></qti-item-body></qti-assessment-item>"
        },
        {
          "identifier": "i19b-shared-css-vocab-3",
          "guid": "0000-0004-0003",
          "xml": `<qti-assessment-item 
    xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd"
    identifier="i19b-shared-css-vocab-3" title="i19b Shared CSS Vocabulary 3 (Margin/Padding)"
    time-dependent="false" adaptive="false">
    <qti-item-body>
      <div>
        <![CDATA[<style>
        /* ========================================== Utility CSS to demonstrate margin/padding. These styles not part of shared css ========================================== */
        .container-200x100 { width: 200px; height: 100px; }
        .muted { color: #999999;font-size: smaller; }
        .border-1 { border: 1px solid #888888; }
        .pad-0 { padding: 0; }
        [class*="qti-layout-col"] { background-color: #fff; }
        </style>]]>
        
        <div class="qti-well">
          <p>The <strong>Margin</strong> and <strong>Padding</strong> utility classes are named using the format:</p><pre>.qti-{property}{-sides}-{size}</pre><p>Where <strong>property</strong> is one of:</p><p>  <strong>margin</strong> - for classes that set <strong>margin</strong><br />  <strong>padding</strong> - for classes that set <strong>padding</strong></p><p>Where <strong>sides</strong> is one of:</p><p>   <strong>t</strong> - for classes that set margin-top or padding-top<br />   <strong>b</strong> - for classes that set margin-bottom or padding-bottom<br />   <strong>s</strong> - (start) for classes that set margin-left or padding-left in LTR, margin-right or padding-right in RTL<br />   <strong>e</strong> - (end) for classes that set margin-right or padding-right in LTR, margin-left or padding-left in RTL<br />   <strong>x</strong> - for classes that set both *-left and *-right<br />   <strong>y</strong> - for classes that set both *-top and *-bottom<br />   blank - for classes that set a margin or padding on all 4 sides of the element</p><p>Where <strong>size</strong> is one of (assuming a default $spacer = 1rem):</p><p>  <strong>0</strong> - for classes that eliminate the margin or padding by setting it to 0<br />  <strong>1</strong> - (by default) for classes that set the margin or padding to 1rem * .25<br />  <strong>2</strong> - (by default) for classes that set the margin or padding to 1rem * .5<br />  <strong>3</strong> - (by default) for classes that set the margin or padding to 1rem<br />  <strong>4</strong> - (by default) for classes that set the margin or padding to 1rem * 1.5<br />  <strong>5</strong> - (by default) for classes that set the margin or padding to 1rem * 3<br />  <strong>auto</strong> - for classes that set the margin to auto</p>
        </div> <!-- /well -->
        
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>Padding qti-padding-{ 0 | 1 | 2 | 3 | 4 | 5 }</h4>
            <div class="qti-display-inline-block"><table><tbody><tr><td class="border-1 qti-padding-0">qti-padding-0</td></tr></tbody></table></div>
            <div class="qti-display-inline-block"><table><tbody><tr><td class="border-1 qti-padding-1">qti-padding-1</td></tr></tbody></table></div>
            <div class="qti-display-inline-block"><table><tbody><tr><td class="border-1 qti-padding-2">qti-padding-2</td></tr></tbody></table></div>
            <div class="qti-display-inline-block"><table><tbody><tr><td class="border-1 qti-padding-3">qti-padding-3</td></tr></tbody></table></div>
            <div class="qti-display-inline-block"><table><tbody><tr><td class="border-1 qti-padding-4">qti-padding-4</td></tr></tbody></table></div>
            <div class="qti-display-inline-block"><table><tbody><tr><td class="border-1 qti-padding-5">qti-padding-5</td></tr></tbody></table></div>
          </div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>Padding qti-padding-x-{ 0 | 1 | 2 | 3 | 4 | 5 }</h4>
            <table><tbody><tr><td class="border-1 pad-0 qti-padding-x-0">qti-padding-x-0</td><td class="border-1 pad-0 qti-padding-x-1">qti-padding-x-1</td><td class="border-1 pad-0 qti-padding-x-2">qti-padding-x-2</td><td class="border-1 pad-0 qti-padding-x-3">qti-padding-x-3</td><td class="border-1 pad-0 qti-padding-x-4">qti-padding-x-4</td><td class="border-1 pad-0 qti-padding-x-5">qti-padding-x-5</td></tr></tbody></table>
          </div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>Padding qti-paddding-s-{ 0 | 1 | 2 | 3 | 4 | 5 } LTR</h4>
            <table><tbody><tr><td class="border-1 qti-padding-s-0">qti-padding-s-0</td><td class="border-1 qti-padding-s-1">qti-padding-s-1</td><td class="border-1 qti-padding-s-2">qti-padding-s-2</td><td class="border-1 qti-padding-s-3">qti-padding-s-3</td><td class="border-1 qti-padding-s-4">qti-padding-s-4</td><td class="border-1 qti-padding-s-5">qti-padding-s-5</td></tr></tbody></table>
          </div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>Padding qti-padding-e-{ 0 | 1 | 2 | 3 | 4 | 5 } LTR</h4>
            <table><tbody><tr><td class="border-1 qti-padding-e-0">qti-padding-e-0</td><td class="border-1 qti-padding-e-1">qti-padding-e-1</td><td class="border-1 qti-padding-e-2">qti-padding-e-2</td><td class="border-1 qti-padding-e-3">qti-padding-e-3</td><td class="border-1 qti-padding-e-4">qti-padding-e-4</td><td class="border-1 qti-padding-e-5">qti-padding-e-5</td></tr></tbody></table>
          </div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col4">
            <h4>Padding qti-padding-y-{ 0 | 1 | 2 | 3 | 4 | 5 }</h4>
            <table><tbody><tr><td class="border-1 pad-0 qti-padding-y-0">qti-padding-y-0</td></tr><tr><td class="border-1 pad-0 qti-padding-y-1">qti-padding-y-1</td></tr><tr><td class="border-1 pad-0 qti-padding-y-2">qti-padding-y-2</td></tr><tr><td class="border-1 pad-0 qti-padding-y-3">qti-padding-y-3</td></tr><tr><td class="border-1 pad-0 qti-padding-y-4">qti-padding-y-4</td></tr><tr><td class="border-1 pad-0 qti-padding-y-5">qti-padding-y-5</td></tr></tbody></table>
          </div>
          <div class="qti-layout-col4">
            <h4>Padding padding-t-{ 0 | 1 | 2 | 3 | 4 | 5 }</h4>
            <table><tbody><tr><td class="border-1 pad-0 qti-padding-t-0">qti-padding-t-0</td></tr><tr><td class="border-1 pad-0 qti-padding-t-1">qti-padding-t-1</td></tr><tr><td class="border-1 pad-0 qti-padding-t-2">qti-padding-t-2</td></tr><tr><td class="border-1 pad-0 qti-padding-t-3">qti-padding-t-3</td></tr><tr><td class="border-1 pad-0 qti-padding-t-4">qti-padding-t-4</td></tr><tr><td class="border-1 pad-0 qti-padding-t-5">qti-padding-t-5</td></tr></tbody></table>
          </div>
          <div class="qti-layout-col4">
            <h4>Padding padding-b-{ 0 | 1 | 2 | 3 | 4 | 5 }</h4>
            <table><tbody><tr><td class="border-1 pad-0 qti-padding-b-0">qti-padding-b-0</td></tr><tr><td class="border-1 pad-0 qti-padding-b-1">qti-padding-b-1</td></tr><tr><td class="border-1 pad-0 qti-padding-b-2">qti-padding-b-2</td></tr><tr><td class="border-1 pad-0 qti-padding-b-3">qti-padding-b-3</td></tr><tr><td class="border-1 pad-0 qti-padding-b-4">qti-padding-b-4</td></tr><tr><td class="border-1 pad-0 qti-padding-b-5">qti-padding-b-5</td></tr></tbody></table>
          </div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>Margin qti-margin-{ 0 | 1 | 2 | 3 | 4 | 5 | auto }</h4>
            <div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-0">qti-margin-0</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-1">qti-margin-1</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-2">qti-margin-2</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-3">qti-margin-3</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-4">qti-margin-4</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-5">qti-margin-5</div></div>
            <!-- display set to flex so the auto height works as expected -->
            <div class="container-200x100 qti-display-flex qti-bordered qti-padding-0"><div class="qti-bordered qti-margin-auto">qti-margin-auto</div></div>
          </div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>Margin qti-margin-x-{ 0 | 1 | 2 | 3 | 4 | 5 | auto }</h4>
            <div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-x-0">qti-margin-x-0</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-x-1">qti-margin-x-1</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-x-2">qti-margin-x-2</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-x-3">qti-margin-x-3</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-x-4">qti-margin-x-4</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-x-5">qti-margin-x-5</div></div><div class="container-200x100 qti-display-flex qti-bordered qti-padding-0"><div class="qti-bordered qti-margin-x-auto">qti-margin-x-auto</div></div>
          </div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>Margin qti-margin-y-{ 0 | 1 | 2 | 3 | 4 | 5 | auto }</h4>
            <div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-y-0">qti-margin-y-0</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-y-1">qti-margin-y-1</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-y-2">qti-margin-y-2</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-y-3">qti-margin-y-3</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-y-4">qti-margin-y-4</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-y-5">qti-margin-y-5</div></div><div class="container-200x100 qti-display-flex qti-bordered qti-padding-0"><div class="qti-bordered qti-margin-y-auto">qti-margin-y-auto</div></div>
          </div>
        </div>
            
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>Margin qti-margin-t-{ 0 | 1 | 2 | 3 | 4 | 5 | auto }</h4>
            <div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-t-0">qti-margin-t-0</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-t-1">qti-margin-t-1</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-t-2">qti-margin-t-2</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-t-3">qti-margin-t-3</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-t-4">qti-margin-t-4</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-t-5">qti-margin-t-5</div></div><div class="container-200x100 qti-display-flex qti-bordered qti-padding-0"><div class="qti-bordered qti-margin-t-auto">qti-margin-t-auto</div></div>
          </div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>Margin qti-margin-b-{ 0 | 1 | 2 | 3 | 4 | 5 | auto }</h4>
            <div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-b-0">qti-margin-b-0</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-b-1">qti-margin-b-1</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-b-2">qti-margin-b-2</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-b-3">qti-margin-b-3</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-b-4">qti-margin-b-4</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-b-5">qti-margin-b-5</div></div><div class="container-200x100 qti-display-flex qti-bordered qti-padding-0"><div class="qti-bordered qti-margin-b-auto">qti-margin-b-auto</div></div>
          </div>
        </div>
            
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>Margin qti-margin-s-{ 0 | 1 | 2 | 3 | 4 | 5 | auto }</h4>
            <div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-s-0">qti-margin-s-0</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-s-1">qti-margin-s-1</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-s-2">qti-margin-s-2</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-s-3">qti-margin-s-3</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-s-4">qti-margin-s-4</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-s-5">qti-margin-s-5</div></div><div class="container-200x100 qti-display-flex qti-bordered qti-padding-0"><div class="qti-bordered qti-margin-s-auto">qti-margin-s-auto</div></div>
          </div>
        </div>
            
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>Margin qti-margin-e-{ 0 | 1 | 2 | 3 | 4 | 5 | auto }</h4>
            <div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-e-0">qti-margin-e-0</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-e-1">qti-margin-e-1</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-e-2">qti-margin-e-2</div</div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-e-3">qti-margin-e-3</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-e-4">qti-margin-e-4</div></div><div class="qti-display-inline-block qti-bordered qti-padding-0"><div class="qti-display-inline-block qti-bordered qti-margin-e-5">qti-margin-e-5</div></div><div class="container-200x100 qti-display-flex qti-bordered qti-p-0"><div class="qti-bordered qti-margin-e-auto">qti-margin-e-auto</div></div>
          </div>
        </div>
      </div>
    </qti-item-body>
  </qti-assessment-item>`
        },
        {
          "identifier": "i19b-shared-css-vocab-4",
          "guid": "0000-0004-0004",
          "xml": `<qti-assessment-item 
    xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd" identifier="i19b-shared-css-vocab-4" title="i19b Shared CSS Vocabulary 4 (Display)"
    time-dependent="false" adaptive="false">
    <qti-item-body>
      <div>
        <![CDATA[<style>/* ==========================================  Utility CSS to demonstrate display. These styles not part of shared css  ========================================== */
        [class*="qti-layout-col"] { background-color: #fff; }
        body { font-family: helvetica, arial, sans-serif; font-size: 16px; line-height: 2rem; }
        h4 { margin-top: 1rem; margin-bottom: 1rem; }
        div.code { font-size: smaller;line-height: .85rem; }
        div.element {
          /* blue */
          background-color: #3d8ef8;
        }
        div.element span {
          background-color: black; 
          color: white; letter-spacing: 1px;
        }
        div.element, span { border-radius: 5px; }
        </style>]]>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <div class="qti-well">
              <p>The <strong>Display</strong> utility classes are named using the format:</p>
              <pre>.qti-display-{displaystyle}</pre>
              <p>Where <strong>{displaystyle}</strong> is one of:</p>
              <p>
                <strong>block</strong>, <strong>inline</strong>, <strong>inline-block</strong>, <strong>none</strong>, <strong>flex</strong>, <strong>inline-flex</strong>, <strong>grid</strong>, <strong>inline-grid</strong>, <strong>table</strong>, <strong>table-row</strong>,<strong>list-item</strong>
              </p>
              <p>The following markup is used to demonstrate the Display utility classes:</p>
              <div class="code">
                <pre>&lt;div class="qti-padding-2 qti-margin-3"&gt;</pre><pre>  &lt;span class="qti-margin-1 qti-padding-1"&gt;First&lt;/span&gt;</pre><pre>  &lt;span class="qti-margin-1 qti-padding-1"&gt;Second&lt;/span&gt;</pre><pre>  &lt;span class="qti-margin-1 qti-padding-1"&gt;Third&lt;/span&gt;</pre><pre>&lt;/div&gt;</pre><pre>&lt;div class="qti-padding-2 qti-margin-3"&gt;</pre><pre>  &lt;span class="qti-margin-1 qti-padding-1"&gt;First&lt;/span&gt;</pre><pre>  &lt;span class="qti-margin-1 qti-padding-1"&gt;Second&lt;/span&gt;</pre><pre>  &lt;span class="qti-margin-1 qti-padding-1"&gt;Third&lt;/span&gt;</pre><pre>&lt;/div&gt;</pre>
              </div> <!-- /code -->
            </div> <!-- /well -->
          </div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>qti-display-block</h4>
            <div class="element qti-display-block qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div><div class="element qti-display-block qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div>
          </div>
        </div>
            
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>qti-display-inline</h4>
            <div class="element qti-display-inline qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div><div class="element qti-display-inline qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div>
          </div>
        </div>
            
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>qti-display-inline-block</h4>
            <div class="element qti-display-inline-block qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div><div class="element qti-display-inline-block qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div>
          </div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>qti-display-none</h4>
            <div class="element qti-display-none qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div><div class="element qti-display-none qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div>
          </div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>qti-display-flex</h4>
            <div class="element qti-display-flex qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div><div class="element qti-display-flex qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div>
          </div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>qti-display-inline-flex</h4>
            <div class="element qti-display-inline-flex qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div><div class="element qti-display-inline-flex qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div>
          </div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>qti-display-grid</h4>
            <div class="element qti-display-grid qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div><div class="element qti-display-grid qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div>
          </div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>qti-display-inline-grid</h4>
            <div class="element qti-display-inline-grid qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div><div class="element qti-display-inline-grid qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div>
          </div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>qti-display-table</h4>
            <div class="element qti-display-table qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div><div class="element qti-display-table qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div>
          </div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>qti-display-table-row</h4>
            <div class="element qti-display-table-row qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div><div class="element qti-display-table-row qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div>
          </div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <h4>qti-display-list-item</h4>
            <div class="element qti-display-list-item qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div><div class="element qti-display-list-item qti-padding-2 qti-margin-3"><span class="qti-margin-1 qti-padding-1">First</span><span class="qti-margin-1 qti-padding-1">Second</span><span class="qti-margin-1 qti-padding-1">Third</span></div>
          </div>
        </div>
      </div>
    </qti-item-body>
  </qti-assessment-item>`
        },
        {
          "identifier": "i19b-shared-css-vocab-5",
          "guid": "0000-0004-0005",
          "xml": `<qti-assessment-item 
    xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd" identifier="i19b-shared-css-vocab-5" title="i19b Shared CSS Vocabulary 5 (Height)"
    time-dependent="false" adaptive="false">
    <qti-item-body>
      <div>
        <![CDATA[<style>
        /* ==========================================         Utility CSS to demonstrate display.         These styles not part of shared css         ========================================== */
        [class*="qti-layout-col"] { background-color: #fff; }
        .container-height-200 { height: 200px;background-color: #ddd; }
        div.code { font-size: smaller; line-height: .75rem; }
        div.element {
          /* blue */
          background-color: #3d8ef8;
          color: white;
          letter-spacing: 1px;
          text-align: center;
          width: 100%;
          padding: 1;
          margin-bottom: .5rem;
          margin-top: 1rem;
          border-radius: 5px;
        }
        div.bar { background-color: black;color: white; letter-spacing: 1px; padding: 0; border-radius: 5px; }
        </style>]]>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <div class="qti-well">
              <p>The <strong>Height</strong> utility classes are named using the format:</p>
              <pre>.qti-height-{heightstyle}</pre>
              <p>Where <strong>{heightstyle}</strong> is one of (including the heightstyle definition):</p>
              <div class="code">
                <pre>0       { height: 0px; }</pre>
                <pre>px      { height: 1px; }</pre>
                <pre>0p5     { height: 0.125rem; }</pre>
                <pre>1       { height: 0.25rem; }</pre>
                <pre>1p5     { height: 0.375rem; }</pre>
                <pre>2       { height: 0.5rem; }</pre>
                <pre>2p5     { height: 0.625rem; }</pre>
                <pre>3       { height: 0.75rem; }</pre>
                <pre>3p5     { height: 0.875rem; }</pre>
                <pre>4       { height: 1rem; }</pre>
                <pre>5       { height: 1.25rem; }</pre>
                <pre>6       { height: 1.5rem; }</pre>
                <pre>7       { height: 1.75rem; }</pre>
                <pre>8       { height: 2rem; }</pre>
                <pre>9       { height: 2.25rem; }</pre>
                <pre>10      { height: 2.5rem; }</pre>
                <pre>11      { height: 2.75rem; }</pre>
                <pre>12      { height: 3rem; }</pre>
                <pre>14      { height: 3.5rem; }</pre>
                <pre>16      { height: 4rem; }</pre>
                <pre>20      { height: 5rem; }</pre>
                <pre>24      { height: 6rem; }</pre>
                <pre>28      { height: 7rem; }</pre>
                <pre>32      { height: 8rem; }</pre>
                <pre>36      { height: 9rem; }</pre>
                <pre>40      { height: 10rem; }</pre>
                <pre>44      { height: 11rem; }</pre>
                <pre>48      { height: 12rem; }</pre>
                <pre>52      { height: 13rem; }</pre>
                <pre>56      { height: 14rem; }</pre>
                <pre>60      { height: 15rem; }</pre>
                <pre>64      { height: 16rem; }</pre>
                <pre>72      { height: 18rem; }</pre>
                <pre>80      { height: 20rem; }</pre>
                <pre>96      { height: 24rem; }</pre>
                <pre>1-2     { height: 50%; }</pre>
                <pre>1-3     { height: 33.333333%; }</pre>
                <pre>2-3     { height: 66.666667%; }</pre>
                <pre>1-4     { height: 25%; }</pre>
                <pre>2-4     { height: 50%; }</pre>
                <pre>3-4     { height: 75%; }</pre>
                <pre>1-5     { height: 20%; }</pre>
                <pre>2-5     { height: 40%; }</pre>
                <pre>3-5     { height: 60%; }</pre>
                <pre>4-5     { height: 80%; }</pre>
                <pre>1-6     { height: 16.666667%; }</pre>
                <pre>2-6     { height: 33.333333%; }</pre>
                <pre>3-6     { height: 50%; }</pre>
                <pre>4-6     { height: 66.666667%; }</pre>
                <pre>5-6     { height: 83.333333%; }</pre>
                <pre>full    { height: 100%; }</pre>
                <pre>auto    { height: auto; }</pre>
              </div>
            </div><!-- /well -->
          </div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">0</div></div><div class="qti-layout-col1"><div class="element">px</div></div><div class="qti-layout-col1"><div class="element">0p5</div></div><div class="qti-layout-col1"><div class="element">1</div></div><div class="qti-layout-col1"><div class="element">1p5</div></div><div class="qti-layout-col1"><div class="element">2</div></div><div class="qti-layout-col1"><div class="element">2p5</div></div><div class="qti-layout-col1"><div class="element">3</div></div><div class="qti-layout-col1"><div class="element">3p5</div></div><div class="qti-layout-col1"><div class="element">4</div></div><div class="qti-layout-col1"><div class="element">5</div></div><div class="qti-layout-col1"><div class="element">6</div></div>
        </div>
          
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-0"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-px"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-0p5"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-1"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-1p5"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-2"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-2p5"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-3"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-3p5"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-4"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-5"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-6"></div></div>
        </div>
          
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">7</div></div><div class="qti-layout-col1"><div class="element">8</div></div><div class="qti-layout-col1"><div class="element">9</div></div><div class="qti-layout-col1"><div class="element">10</div></div><div class="qti-layout-col1"><div class="element">11</div></div><div class="qti-layout-col1"><div class="element">12</div></div><div class="qti-layout-col1"><div class="element">14</div></div><div class="qti-layout-col1"><div class="element">16</div></div><div class="qti-layout-col1"><div class="element">20</div></div><div class="qti-layout-col1"><div class="element">24</div></div><div class="qti-layout-col1"><div class="element">28</div></div><div class="qti-layout-col1"><div class="element">32</div></div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-7"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-8"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-9"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-10"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-11"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-12"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-14"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-16"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-20"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-24"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-28"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-32"></div></div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">36</div></div><div class="qti-layout-col1"><div class="element">40</div></div><div class="qti-layout-col1"><div class="element">44</div></div><div class="qti-layout-col1"><div class="element">48</div></div><div class="qti-layout-col1"><div class="element">52</div></div><div class="qti-layout-col1"><div class="element">56</div></div><div class="qti-layout-col1"><div class="element">60</div></div><div class="qti-layout-col1"><div class="element">64</div></div><div class="qti-layout-col1"><div class="element">72</div></div><div class="qti-layout-col1"><div class="element">80</div></div><div class="qti-layout-col1"><div class="element">96</div></div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-36"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-40"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-44"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-48"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-52"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-56"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-60"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-64"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-72"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-80"></div></div><div class="qti-layout-col1"><div class="qti-display-flex bar qti-height-96"></div></div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">1-2</div></div><div class="qti-layout-col1"><div class="element">1-3</div></div><div class="qti-layout-col1"><div class="element">2-3</div></div><div class="qti-layout-col1"><div class="element">1-4</div></div><div class="qti-layout-col1"><div class="element">2-4</div></div><div class="qti-layout-col1"><div class="element">3-4</div></div><div class="qti-layout-col1"><div class="element">1-5</div></div><div class="qti-layout-col1"><div class="element">2-5</div></div><div class="qti-layout-col1"><div class="element">3-5</div></div><div class="qti-layout-col1"><div class="element">4-5</div></div><div class="qti-layout-col1"><div class="element">full</div></div><div class="qti-layout-col1"><div class="element">auto</div></div>
        </div>
          
        <div class="qti-layout-row">
          <div class="qti-layout-col1 container-height-200"><div class="qti-display-flex bar qti-height-1-2"></div></div><div class="qti-layout-col1 container-height-200"><div class="qti-display-flex bar qti-height-1-3"></div></div><div class="qti-layout-col1 container-height-200"><div class="qti-display-flex bar qti-height-2-3"></div></div><div class="qti-layout-col1 container-height-200"><div class="qti-display-flex bar qti-height-1-4"></div></div><div class="qti-layout-col1 container-height-200"><div class="qti-display-flex bar qti-height-2-4"></div></div><div class="qti-layout-col1 container-height-200"><div class="qti-display-flex bar qti-height-3-4"></div></div><div class="qti-layout-col1 container-height-200"><div class="qti-display-flex bar qti-height-1-5"></div></div><div class="qti-layout-col1 container-height-200"><div class="qti-display-flex bar qti-height-2-5"></div></div><div class="qti-layout-col1 container-height-200"><div class="qti-display-flex bar qti-height-3-5"></div></div><div class="qti-layout-col1 container-height-200"><div class="qti-display-flex bar qti-height-4-5"></div></div><div class="qti-layout-col1 container-height-200"><div class="qti-display-flex bar qti-height-full"></div></div><div class="qti-layout-col1 container-height-200"><div class="qti-display-flex bar qti-height-auto">I am in a height auto div</div></div>
        </div>
        
      </div>
    </qti-item-body>
  </qti-assessment-item>`
        },
        {
          "identifier": "i19b-shared-css-vocab-6",
          "guid": "0000-0004-0006",
          "xml": `<qti-assessment-item 
    xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd"
    identifier="i19b-shared-css-vocab-6" title="i19b Shared CSS Vocabulary 6 (Width)"
    time-dependent="false" adaptive="false">
    <qti-item-body>
      <div>
        <![CDATA[<style>
        /* ==========================================         Utility CSS to demonstrate display.         These styles not part of shared css         ========================================== */
        [class*="qti-layout-col"] { background-color: #fff; }
        .container-background { background-color: #ddd; }
        div.code { font-size: smaller; line-height: .75rem; }
        div.element {
          /* blue */
          background-color: #3d8ef8;
          color: white;
          font-size: 15px;
          line-height: 1.5rem;
          letter-spacing: 1px;
          text-align: center;
          vertical-align: middle;
          width: 100%;
          padding: 1px;
          margin-bottom: .5rem;
          border-radius: 5px;
        }
        div.bar { display: block;background-color: black;color: white; letter-spacing: 1px; padding: 0;border-radius: 5px;height: 1.65rem; }            div.bar.inline { display:inline-block; font-size: 15px; line-height: 1.5rem; letter-spacing: 1px; padding-top: 1px; }
        </style>]]>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <div class="qti-well">
              <p>The <strong>Width</strong> utility classes are named using the format:</p>
              <pre>.qti-width-{widthstyle}</pre>
              <p>Where <strong>{widthstyle}</strong> is one of (including the widthstyle definition):</p>
              <div class="code">
                <pre>0       { width: 0px; }</pre>
                <pre>px      { width: 1px; }</pre>
                <pre>0p5     { width: 0.125rem; }</pre>
                <pre>1       { width: 0.25rem; }</pre>
                <pre>1p5     { width: 0.375rem; }</pre>
                <pre>2       { width: 0.5rem; }</pre>
                <pre>2p5     { width: 0.625rem; }</pre>
                <pre>3       { width: 0.75rem; }</pre>
                <pre>3p5     { width: 0.875rem; }</pre>
                <pre>4       { width: 1rem; }</pre>
                <pre>5       { width: 1.25rem; }</pre>
                <pre>6       { width: 1.5rem; }</pre>
                <pre>7       { width: 1.75rem; }</pre>
                <pre>8       { width: 2rem; }</pre>
                <pre>9       { width: 2.25rem; }</pre>
                <pre>10      { width: 2.5rem; }</pre>
                <pre>11      { width: 2.75rem; }</pre>
                <pre>12      { width: 3rem; }</pre>
                <pre>14      { width: 3.5rem; }</pre>
                <pre>16      { width: 4rem; }</pre>
                <pre>20      { width: 5rem; }</pre>
                <pre>24      { width: 6rem; }</pre>
                <pre>28      { width: 7rem; }</pre>
                <pre>32      { width: 8rem; }</pre>
                <pre>36      { width: 9rem; }</pre>
                <pre>40      { width: 10rem; }</pre>
                <pre>44      { width: 11rem; }</pre>
                <pre>48      { width: 12rem; }</pre>
                <pre>52      { width: 13rem; }</pre>
                <pre>56      { width: 14rem; }</pre>
                <pre>60      { width: 15rem; }</pre>
                <pre>64      { width: 16rem; }</pre>
                <pre>72      { width: 18rem; }</pre>
                <pre>80      { width: 20rem; }</pre>
                <pre>96      { width: 24rem; }</pre>
                <pre>1-2     { width: 50%; }</pre>
                <pre>1-3     { width: 33.333333%; }</pre>
                <pre>2-3     { width: 66.666667%; }</pre>
                <pre>1-4     { width: 25%; }</pre>
                <pre>2-4     { width: 50%; }</pre>
                <pre>3-4     { width: 75%; }</pre>
                <pre>1-5     { width: 20%; }</pre>
                <pre>2-5     { width: 40%; }</pre>
                <pre>3-5     { width: 60%; }</pre>
                <pre>4-5     { width: 80%; }</pre>
                <pre>1-6     { width: 16.666667%; }</pre>
                <pre>2-6     { width: 33.333333%; }</pre>
                <pre>3-6     { width: 50%; }</pre>
                <pre>4-6     { width: 66.666667%; }</pre>
                <pre>5-6     { width: 83.333333%; }</pre>
                <pre>1-12    { width: 8.333333%; }</pre>
                <pre>2-12    { width: 16.666667%; }</pre>
                <pre>3-12    { width: 25%; }</pre>
                <pre>4-12    { width: 33.333333%; }</pre>
                <pre>5-12    { width: 41.666667%; }</pre>
                <pre>6-12    { width: 50%; }</pre>
                <pre>7-12    { width: 58.333333%; }</pre>
                <pre>8-12    { width: 66.666667%; }</pre>
                <pre>9-12    { width: 75%; }</pre>
                <pre>10-12   { width: 83.333333%; }</pre>
                <pre>11-12   { width: 91.666667%; }</pre>
                <pre>full    { width: 100%; }</pre>
                <pre>auto    { width: auto; }</pre>
              </div><!-- /code -->
            </div><!-- /well -->
          </div>
        </div>
        
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">0</div></div><div class="qti-layout-col11"><div class="bar qti-width-0"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">px</div></div><div class="qti-layout-col11"><div class="bar qti-width-px"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">0p5</div></div><div class="qti-layout-col11"><div class="bar qti-width-0p5"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">1</div></div><div class="qti-layout-col11"><div class="bar qti-width-1"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">1p5</div></div><div class="qti-layout-col11"><div class="bar qti-width-1p5"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">2</div></div><div class="qti-layout-col11"><div class="bar qti-width-2"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">2p5</div></div><div class="qti-layout-col11"><div class="bar qti-width-2p5"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">3</div></div><div class="qti-layout-col11"><div class="bar qti-width-3"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">3p5</div></div><div class="qti-layout-col11"><div class="bar qti-width-3p5"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">4</div></div><div class="qti-layout-col11"><div class="bar qti-width-4"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">5</div></div><div class="qti-layout-col11"><div class="bar qti-width-5"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">6</div></div><div class="qti-layout-col11"><div class="bar qti-width-6"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">7</div></div><div class="qti-layout-col11"><div class="bar qti-width-7"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">8</div></div><div class="qti-layout-col11"><div class="bar qti-width-8"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">9</div></div><div class="qti-layout-col11"><div class="bar qti-width-9"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">10</div></div><div class="qti-layout-col11"><div class="bar qti-width-10"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">11</div></div><div class="qti-layout-col11"><div class="bar qti-width-11"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">12</div></div><div class="qti-layout-col11"><div class="bar qti-width-12"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">14</div></div><div class="qti-layout-col11"><div class="bar qti-width-14"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">16</div></div><div class="qti-layout-col11"><div class="bar qti-width-16"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">20</div></div><div class="qti-layout-col11"><div class="bar qti-width-20"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">24</div></div><div class="qti-layout-col11"><div class="bar qti-width-24"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">28</div></div><div class="qti-layout-col11"><div class="bar qti-width-28"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">32</div></div><div class="qti-layout-col11"><div class="bar qti-width-32"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">36</div></div><div class="qti-layout-col11"><div class="bar qti-width-36"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">40</div></div><div class="qti-layout-col11"><div class="bar qti-width-40"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">44</div></div><div class="qti-layout-col11"><div class="bar qti-width-44"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">48</div></div><div class="qti-layout-col11"><div class="bar qti-width-48"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">52</div></div><div class="qti-layout-col11"><div class="bar qti-width-52"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">56</div></div><div class="qti-layout-col11"><div class="bar qti-width-56"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">60</div></div><div class="qti-layout-col11"><div class="bar qti-width-60"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">64</div></div><div class="qti-layout-col11"><div class="bar qti-width-64"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">72</div></div><div class="qti-layout-col11"><div class="bar qti-width-72"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">80</div></div><div class="qti-layout-col11"><div class="bar qti-width-80"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">96</div></div><div class="qti-layout-col11"><div class="bar qti-width-96"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">1-2</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-1-2"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">1-3</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-1-3"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">2-3</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-2-3"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">1-4</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-1-4"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">2-4</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-2-4"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">1-5</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-1-5"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">2-5</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-2-5"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">3-5</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-3-5"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">4-5</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-4-5"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">1-6</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-1-6"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">2-6</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-2-6"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">3-6</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-3-6"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">4-6</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-4-6"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">5-6</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-5-6"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">1-12</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-1-12"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">2-12</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-2-12"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">3-12</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-3-12"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">4-12</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-4-12"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">5-12</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-5-12"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">6-12</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-6-12"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">7-12</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-7-12"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">8-12</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-8-12"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">9-12</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-9-12"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">10-12</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-10-12"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">11-12</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-11-12"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">full</div></div><div class="qti-layout-col11 container-background"><div class="bar qti-width-full"></div></div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col1"><div class="element">auto</div></div><div class="qti-layout-col11 container-background"><div class="bar inline qti-width-auto">I am content in a width auto div</div></div>
        </div>
      </div>
    </qti-item-body>
  </qti-assessment-item>`
        },
        {
          "identifier": "i19b-shared-css-vocab-7",
          "guid": "0000-0004-0007",
          "xml": `<qti-assessment-item
    xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd"
    identifier="i19b-shared-css-vocab-7" title="i19b Shared CSS Vocabulary 7 (Text Indent Styles)"
    time-dependent="false" adaptive="false">
    <qti-item-body>
      <div>
        <![CDATA[<style>
        /* ==========================================         Utility CSS to demonstrate display.         These styles not part of shared css         ========================================== */
        [class*="qti-layout-col"] { background-color: #fff; }
        div.code { font-size: smaller; line-height: .75rem; }
        </style>]]>
      
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <div class="qti-well">
              <p>The <strong>Text-Indent</strong> utility classes are named using the format:</p>
              <pre>.qti-text-indent-{indentstyle}</pre>
              <p>Where <strong>{indentstyle}</strong> is one of (including the indentstyle definition):</p>
              <div class="code">
              <pre>0       { text-indent: 0px; }</pre>
              <pre>px      { text-indent: 1px; }</pre>
              <pre>0p5     { text-indent: 0.125rem; }</pre>
              <pre>1       { text-indent: 0.25rem; }</pre>
              <pre>1p5     { text-indent: 0.375rem; }</pre>
              <pre>2       { text-indent: 0.5rem; }</pre>
              <pre>2p5     { text-indent: 0.625rem; }</pre>
              <pre>3       { text-indent: 0.75rem; }</pre>
              <pre>3p5     { text-indent: 0.875rem; }</pre>
              <pre>4       { text-indent: 1rem; }</pre>
              <pre>5       { text-indent: 1.25rem; }</pre>
              <pre>6       { text-indent: 1.5rem; }</pre>
              <pre>7       { text-indent: 1.75rem; }</pre>
              <pre>8       { text-indent: 2rem; }</pre>
              <pre>12      { text-indent: 3rem; }</pre>
              <pre>16      { text-indent: 4rem; }</pre>
              <pre>20      { text-indent: 5rem; }</pre>
              <pre>24      { text-indent: 6rem; }</pre>
              <pre>28      { text-indent: 7rem; }</pre>
              <pre>32      { text-indent: 8rem; }</pre>
            </div>
          </div> <!-- /well -->
        </div>
      </div>
    
      <div class="qti-layout-row">
        <div class="qti-layout-col6">
      
          <h4>qti-text-indent-0</h4>
          <p class="qti-bordered qti-text-indent-0"> Paragraph with class="qti-text-indent-0".  The quick brown fox jumps over the lazy dog.             The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>
          
          <h4>qti-text-indent-px</h4>
          <p class="qti-bordered qti-text-indent-px">Paragraph with class="qti-text-indent-px".  The quick brown fox jumps over the lazy dog.            The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>
          
          <h4>qti-text-indent-0p5</h4>
          <p class="qti-bordered qti-text-indent-0p5">Paragraph with class="qti-text-indent-0p5".  The quick brown fox jumps over the lazy dog.            The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>
          
          <h4>qti-text-indent-1</h4>
          <p class="qti-bordered qti-text-indent-1">Paragraph with class="qti-text-indent-1".  The quick brown fox jumps over the lazy dog.            The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>
          
          <h4>qti-text-indent-1p5</h4>
          <p class="qti-bordered qti-text-indent-1p5">Paragraph with class="qti-text-indent-1p5".  The quick brown fox jumps over the lazy dog.            The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>
          
          <h4>qti-text-indent-2</h4>
          <p class="qti-bordered qti-text-indent-2">Paragraph with class="qti-text-indent-2".  The quick brown fox jumps over the lazy dog.            The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>
          
          <h4>qti-text-indent-2p5</h4>
          <p class="qti-bordered qti-text-indent-2p5">Paragraph with class="qti-text-indent-2p5".  The quick brown fox jumps over the lazy dog.            The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>
          
          <h4>qti-text-indent-3</h4>
          <p class="qti-bordered qti-text-indent-3">Paragraph with class="qti-text-indent-3".  The quick brown fox jumps over the lazy dog.            The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>
          
          <h4>qti-text-indent-3p5</h4>
          <p class="qti-bordered qti-text-indent-3p5">Paragraph with class="qti-text-indent-3p5".  The quick brown fox jumps over the lazy dog.            The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>
          
          <h4>qti-text-indent-4</h4>
          <p class="qti-bordered qti-text-indent-4">Paragraph with class="qti-text-indent-4".  The quick brown fox jumps over the lazy dog.            The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>
        </div>
        
        <div class="qti-layout-col6">
          <h4>qti-text-indent-5</h4>
          <p class="qti-bordered qti-text-indent-5">Paragraph with with class="qti-text-indent-5".  The quick brown fox jumps over the lazy dog.              The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>
          
          <h4>qti-text-indent-6</h4>
          <p class="qti-bordered qti-text-indent-6">Paragraph with class="qti-text-indent-6".  The quick brown fox jumps over the lazy dog.              The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>
          
          <h4>qti-text-indent-7</h4>
          <p class="qti-bordered qti-text-indent-7">Paragraph with class="qti-text-indent-7".  The quick brown fox jumps over the lazy dog.              The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>
          
          <h4>qti-text-indent-8</h4>
          <p class="qti-bordered qti-text-indent-8">Paragraph with class="qti-text-indent-8".  The quick brown fox jumps over the lazy dog.              The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>
          
          <h4>qti-text-indent-12</h4>
          <p class="qti-bordered qti-text-indent-12">Paragraph with class="qti-text-indent-12".  The quick brown fox jumps over the lazy dog.              The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>
          
          <h4>qti-text-indent-16</h4>
          <p class="qti-bordered qti-text-indent-16">Paragraph with class="qti-text-indent-16".  The quick brown fox jumps over the lazy dog.              The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>
          
          <h4>qti-text-indent-20</h4>
          <p class="qti-bordered qti-text-indent-20">Paragraph with class="qti-text-indent-20".  The quick brown fox jumps over the lazy dog.              The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>
          
          <h4>qti-text-indent-24</h4>
          <p class="qti-bordered qti-text-indent-24">Paragraph with class="qti-text-indent-24".  The quick brown fox jumps over the lazy dog.              The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>            
          
          <h4>qti-text-indent-28</h4>
          <p class="qti-bordered qti-text-indent-28">Paragraph with class="qti-text-indent-28".  The quick brown fox jumps over the lazy dog.              The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>            
          
          <h4>qti-text-indent-32</h4>
          <p class="qti-bordered qti-text-indent-32"> Paragraph with class="qti-text-indent-32".  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>
          </div>
        </div>
      </div>
    </qti-item-body>
  </qti-assessment-item>`
        },
        {
          "identifier": "i19b-shared-css-vocab-8",
          "guid": "0000-0004-0008",
          "xml": `<qti-assessment-item 
    xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd" 
    identifier="i19b-shared-css-vocab-8" title="i19b Shared CSS Vocabulary 8 (List Styles)"
    time-dependent="false" adaptive="false">
    <qti-item-body>
      <div>
        <![CDATA[<style>
        /* ==========================================         Utility CSS to demonstrate display.         These styles not part of shared css         ========================================== */
        [class*="qti-layout-col"] { background-color: #fff; }
        div.code { font-size: smaller; line-height: .75rem; }
        </style>]]>
          
        <div class="qti-layout-row">
          <div class="qti-layout-col12">
            <div class="qti-well">
              <p>The <strong>List Style Type</strong> utility classes are named using the format:</p>
              <pre>.qti-list-style-type-{typestyle}</pre>
              <p>Where <strong>{typestyle}</strong> is one of (including the typestyle definition):</p>
              <div class="code">
                <pre>none                    { list-type-style: none; }</pre>
                <pre>disc                    { list-type-style: disc; }</pre>
                <pre>circle                  { list-type-style: circle; }</pre>
                <pre>square                  { list-type-style: square; }</pre>
                <pre>decimal                 { list-type-style: decimal; }</pre>
                <pre>decimal-leading-zero    { list-style-type: decimal-leading-zero; }</pre>
                <pre>lower-alpha             { list-style-type: lower-alpha; }</pre>
                <pre>upper-alpha             { list-style-type: upper-alpha; }</pre>
                <pre>lower-roman             { list-style-type: lower-roman; }</pre>
                <pre>upper-roman             { list-style-type: upper-roman; }</pre>
                <pre>lower-latin             { list-style-type: lower-latin; }</pre>
                <pre>upper-latin             { list-style-type: upper-latin; }</pre>
                <pre>lower-greek             { list-style-type: lower-greek; }</pre>
                <pre>arabic-indic            { list-style-type: arabic-indic; }</pre>
                <pre>armenian                { list-style-type: armenian; }</pre>
                <pre>lower-armenian          { list-style-type: lower-armenian; }</pre>
                <pre>upper-armenian          { list-style-type: upper-armenian; }</pre>
                <pre>bengali                 { list-style-type: bengali; }</pre>
                <pre>cambodian               { list-style-type: cambodian; }</pre>
                <pre>simp-chinese-formal     { list-style-type: simp-chinese-formal; }</pre>
                <pre>simp-chinese-informal   { list-style-type: simp-chinese-informal; }</pre>
                <pre>trad-chinese-formal     { list-style-type: trad-chinese-formal; }</pre>
                <pre>trad-chinese-informal   { list-style-type: trad-chinese-informal; }</pre>
                <pre>cjk-ideographic         { list-style-type: cjk-ideographic; }</pre>
                <pre>cjk-heavenly-stem       { list-style-type: cjk-heavenly-stem; }</pre>
                <pre>cjk-earthly-branch      { list-style-type: cjk-earthly-branch; }</pre>
                <pre>devanagari              { list-style-type: devanagari; }</pre>
                <pre>ethiopic-halehame-ti-er { list-style-type: ethiopic-halehame-ti-er; }</pre>
                <pre>ethiopic-halehame-ti-et { list-style-type: ethiopic-halehame-ti-et; }</pre>
                <pre>ethiopic-halehame-am    { list-style-type: ethiopic-halehame-am; }</pre>
                <pre>ethiopic-halehame       { list-style-type: ethiopic-halehame; }</pre>
                <pre>georgian                { list-style-type: georgian; }</pre>
                <pre>gujarati                { list-style-type: gujarati; }</pre>
                <pre>gurmukhi                { list-style-type: gurmukhi; }</pre>
                <pre>hangul                  { list-style-type: hangul; }</pre>
                <pre>hangul-consonant        { list-style-type: hangul-consonant; }</pre>
                <pre>hebrew                  { list-style-type: hebrew; }</pre>
                <pre>hiragana                { list-style-type: hiragana; }</pre>
                <pre>hiragana-iroha          { list-style-type: hiragana-iroha; }</pre>
                <pre>khmer                   { list-style-type: khmer; }</pre>
                <pre>korean-hangul-formal    { list-style-type: korean-hangul-formal; }</pre>
                <pre>korean-hanja-formal     { list-style-type: korean-hanja-formal; }</pre>
                <pre>korean-hanja-informal   { list-style-type: korean-hanja-informal; }</pre>
                <pre>lao                     { list-style-type: lao; }</pre>
                <pre>malayalam               { list-style-type: malayalam; }</pre>
                <pre>mongolian               { list-style-type: mongolian; }</pre>
                <pre>myanmar                 { list-style-type: myanmar; }</pre>
                <pre>oriya                   { list-style-type: oriya; }</pre>
                <pre>persian                 { list-style-type: persian; }</pre>
                <pre>thai                    { list-style-type: thai; }</pre>
                <pre>tibetan                 { list-style-type: tibetan; }</pre>
                <pre>telugu                  { list-style-type: telugu; }</pre>
                <pre>urdu                    { list-style-type: urdu; }</pre>
              </div> <!-- /code -->
            </div><!-- /well -->
          </div>
        </div>
        <div class="qti-layout-row">
          <div class="qti-layout-col4">
            <h4>qti-list-style-type-none</h4><ol class="qti-list-style-type-none"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-disc</h4><ol class="qti-list-style-type-disc"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-square</h4><ol class="qti-list-style-type-square"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-circle</h4><ol class="qti-list-style-type-circle"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-decimal</h4><ol class="qti-list-style-type-decimal"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-decimal-leading-zero</h4><ol class="qti-list-style-type-decimal-leading-zero"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-lower-alpha</h4><ol class="qti-list-style-type-lower-alpha"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-upper-alpha</h4><ol class="qti-list-style-type-upper-alpha"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-lower-roman</h4><ol class="qti-list-style-type-lower-roman"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-upper-roman</h4><ol class="qti-list-style-type-upper-roman"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-lower-latin</h4><ol class="qti-list-style-type-lower-latin"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-upper-latin</h4><ol class="qti-list-style-type-upper-latin"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-lower-greek</h4><ol class="qti-list-style-type-lower-greek"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-arabic-indic</h4><ol class="qti-list-style-type-arabic-indic"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-armenian</h4><ol class="qti-list-style-type-armenian"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-lower-armenian</h4><ol class="qti-list-style-type-lower-armenian"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-upper-armenian</h4><ol class="qti-list-style-type-upper-armenian"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-bengali</h4><ol class="qti-list-style-type-bengali"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol>
          </div>
          <div class="qti-layout-col4">
            <h4>qti-list-style-type-cambodian</h4><ol class="qti-list-style-type-cambodian"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-simp-chinese-formal</h4><ol class="qti-list-style-type-simp-chinese-formal"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-simp-chinese-informal</h4><ol class="qti-list-style-type-simp-chinese-informal"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-trad-chinese-formal</h4><ol class="qti-list-style-type-trad-chinese-formal"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-trad-chinese-informal</h4><ol class="qti-list-style-type-trad-chinese-informal"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-cjk-ideographic</h4><ol class="qti-list-style-type-cjk-ideographic "><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-cjk-heavenly-stem</h4><ol class="qti-list-style-type-cjk-heavenly-stem"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-cjk-earthly-branch</h4><ol class="qti-list-style-type-cjk-earthly-branch"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-devanagari</h4><ol class="qti-list-style-type-devanagari"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-ethiopic-halehame-ti-er</h4><ol class="qti-list-style-type-ethiopic-halehame-ti-er"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-ethiopic-halehame-ti-et</h4><ol class="qti-list-style-type-ethiopic-halehame-ti-et"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-ethiopic-halehame-am</h4><ol class="qti-list-style-type-ethiopic-halehame-am"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-ethiopic-halehame</h4><ol class="qti-list-style-type-ethiopic-halehame"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-georgian</h4><ol class="qti-list-style-type-georgian"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-gujarati</h4><ol class="qti-list-style-type-gujarati"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-gurmukhi</h4><ol class="qti-list-style-type-gurmukhi"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-hangul</h4><ol class="qti-list-style-type-hangul"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-hangul-consonant</h4><ol class="qti-list-style-type-hangul-consonant"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol>
          </div>
          <div class="qti-layout-col4">
            <h4>qti-list-style-type-hebrew</h4><ol class="qti-list-style-type-hebrew"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-hiragana</h4><ol class="qti-list-style-type-hiragana"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-hiragana-iroha</h4><ol class="qti-list-style-type-hiragana-iroha"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-khmer</h4><ol class="qti-list-style-type-khmer"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-korean-hangul-formal</h4><ol class="qti-list-style-type-korean-hangul-formal"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-korean-hanja-formal</h4><ol class="qti-list-style-type-korean-hanja-formal"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-korean-hanja-informal</h4><ol class="qti-list-style-type-korean-hanja-informal"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-lao</h4><ol class="qti-list-style-type-lao"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-malayalam</h4><ol class="qti-list-style-type-malayalam"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-mongolian</h4><ol class="qti-list-style-type-mongolian"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-myanmar</h4><ol class="qti-list-style-type-myanmar"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-oriya</h4><ol class="qti-list-style-type-oriya"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-persian</h4><ol class="qti-list-style-type-persian"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-thai</h4><ol class="qti-list-style-type-thai"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-tibetan</h4><ol class="qti-list-style-type-tibetan"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-telugu</h4><ol class="qti-list-style-type-telugu"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol><h4>qti-list-style-type-urdu</h4><ol class="qti-list-style-type-urdu"><li>Apollo</li><li>Hubble</li><li>Chandra</li><li>Cassini-Huygens</li><li>Spitzer</li></ol>
          </div>
        </div>
      </div>
          
    </qti-item-body>
  </qti-assessment-item>`
        }
      ],
      maxItems: 10,
      containerClass: 'qti3-player-container-fluid',
      colorClass: 'qti3-player-color-default',
      containerPaddingClass: 'qti3-player-container-padding-0',
      itemStates: new Map(),
      sessionControl: null,
      pnp: null,
      qti3Player: null,
      performResponseProcessing: true
    }
  },

  methods: {

    initialize () {
      // Score when navigating
      this.performResponseProcessing = true
      // Load pnp
      this.pnp = new PnpFactory()
      // Load sessionControl
      this.sessionControl = new SessionControlFactory()
      this.sessionControl.setValidateResponses(true)
      this.sessionControl.setShowFeedback(false)
    },

    loadFirstItem () {
      this.loadItemAtIndex(0)
    },

    handleNextItem () {
      console.log('[Controller][NextItem][' + this.currentItem + ']')
      if (!this.isTestStarted) {
        this.isTestStarted = true
        this.loadFirstItem()
        return
      }

      this.initiateNavigateNextItem()
    },

    handlePrevItem () {
      console.log('[Controller][PrevItem][' + this.currentItem + ']')
      if (this.currentItem === 0) return

      this.initiateNavigatePrevItem()
    },

    initiateNavigateNextItem () {
      if (this.performResponseProcessing)
        this.qti3Player.endAttempt('navigateNextItem')
      else
        this.qti3Player.suspendAttempt('navigateNextItem')
    },

    navigateNextItem () {
      console.log('[NavigateNextItem]')

      this.currentItem += 1
      this.loadItemAtIndex(this.currentItem)
    },

    initiateNavigatePrevItem () {
      if (this.performResponseProcessing)
        this.qti3Player.endAttempt('navigatePrevItem')
      else
        this.qti3Player.suspendAttempt('navigatePrevItem')
    },

    navigatePrevItem () {
      console.log('[NavigatePrevItem]')

      this.currentItem -= 1
      this.loadItemAtIndex(this.currentItem)
    },

    handleEndAttemptCompleted (data) {
      this.evaluateResults(data)
    },

    handleSuspendAttemptCompleted (data) {
      this.evaluateResults(data)
    },

    evaluateResults (data) {
      // Save our state
      this.setTestStateItemState(data.state)

      if (data.state.validationMessages.length > 0) {
        // Display validation messages
        this.displayInvalidResponseMessages(data.state.validationMessages)
        // Do not proceed if we have any validationMessages
        return
      }

      this.next(data.target)
    },

    next (action) {
      switch (action) {
        case 'navigateNextItem':
          this.navigateNextItem()
          break

        case 'navigatePrevItem':
          this.navigatePrevItem()
          break

        default:
          // Unknown action --> NOOP
      }
    },

    loadItemAtIndex (index) {
      if (index === null) return
      if ((index < 0) || (index > this.maxItems-1)) return

      // Build a configuration
      const configuration = this.getConfiguration(this.items[index].guid)

      this.qti3Player.loadItemFromXml(this.items[index].xml, configuration)
    },

    toggleButtonDisabled (buttonRef, disable) {
      if (disable) {
        buttonRef.setAttribute('disabled', '')
      } else {
        buttonRef.removeAttribute('disabled')
      }
    },

    setTestStateItemState (state) {
      console.log('[Controller][SetItemState][' + state.guid + ']', state)
      this.itemStates.set(state.guid, state)
    },

    getTestStateItemState (guid) {
      console.log('[Controller][GetItemState][' + guid + ']', this.itemStates.get(guid))
      return this.itemStates.get(guid)
    },

    getConfiguration (guid) {
      const configuration = {}

      // Fetch prior state from Test State
      const state = this.getTestStateItemState(guid)
      if (typeof state !== 'undefined') {
        configuration.state = state
      }

      // IMPORTANT: Stamp the item's tracking guid onto the configuration
      configuration.guid = guid
      configuration.pnp = this.pnp.getPnp()
      configuration.sessionControl = this.sessionControl.getSessionControl()

      return configuration
    },

    displayItemAlertEvent (event) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: event.icon,
        html: event.message,
        showConfirmButton: false,
        showCloseButton: true,
        timer: 3000,
        timerProgressBar: true
      })
    },

    displayInvalidResponseMessages (messages) {
      messages.forEach((message) => {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            html: message.message,
            showConfirmButton: false,
            showCloseButton: true,
            timer: 3000,
            timerProgressBar: true
          })
      })
    },

    /**
     * @description Event handler for the QTI3Player component's 'notifyQti3PlayerReady'
     * event.  This event is fired upon mounting of the Qti3Player component.
     *
     * The Qti3Player is now ready for XML loading.
     * @param {Component} qti3Player - the Qti3Player component itself
     */
    handlePlayerReady (qti3Player) {
      this.qti3Player = qti3Player
    },

    /**
     * @description Event handler for the QTI3Player component's 'notifyQti3ItemReady'
     * event.  This event is fired upon completion of the qti-assessment-item
     * component's loading of XML.
     */
    handleItemReady () {
      // NOOP
    }

  },

  mounted () {
    this.initialize()
  }
}
</script>

<style>
</style>
