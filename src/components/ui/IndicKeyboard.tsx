import { logger } from '@/lib/logger';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type React from 'react';
import { X, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateInputFromKeyboard, registerInputForKeyboard } from '@/hooks/useIndicKeyboard';

interface IndicKeyboardProps {
  targetInputId?: string;
  targetElement?: HTMLInputElement | HTMLTextAreaElement | null;
  onInput?: (char: string) => void;
  // Support English UI plus Kannada, Tamil, Hindi input
  lang?: 'en' | 'kn' | 'ta' | 'hi';
}

// Kannada script layout - closer to Google Inscript style (grouped for familiarity)
// Includes independent vowels, common vowel signs, and grouped consonants.
const KANNADA_LAYOUT = {
  // Independent vowels
  vowels: ['ಅ', 'ಆ', 'ಇ', 'ಈ', 'ಉ', 'ಊ', 'ಋ', 'ಎ', 'ಏ', 'ಐ', 'ಒ', 'ಓ', 'ಔ'],
  // Vowel signs and virama (used after consonants)
  row1: ['ಾ', 'ಿ', 'ೀ', 'ು', 'ೂ', 'ೃ', 'ೆ', 'ೇ', 'ೈ', 'ೊ', 'ೋ', 'ೌ', '್'],
  // Consonants grouped broadly like Inscript rows
  row2: ['ಕ', 'ಖ', 'ಗ', 'ಘ', 'ಙ', 'ಚ', 'ಛ', 'ಜ', 'ಝ', 'ಞ'],
  row3: ['ಟ', 'ಠ', 'ಡ', 'ಢ', 'ಣ', 'ತ', 'ಥ', 'ದ', 'ಧ', 'ನ'],
  row4: ['ಪ', 'ಫ', 'ಬ', 'ಭ', 'ಮ', 'ಯ', 'ರ', 'ಲ', 'ವ'],
  row5: ['ಶ', 'ಷ', 'ಸ', 'ಹ', 'ಳ', 'ೞ', 'ಱ'],
  row6: [] as string[],
  row7: [] as string[],
  numbers: ['೦', '೧', '೨', '೩', '೪', '೫', '೬', '೭', '೮', '೯'],
};

// Tamil script layout – approximates Google Tamil99 / INSCRIPT groupings
// Shows independent vowels, common vowel signs, and grouped consonants.
const TAMIL_LAYOUT = {
  // Independent vowels
  vowels: ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ'],
  // Vowel signs and pulli
  row1: ['ா', 'ி', 'ீ', 'ு', 'ூ', 'ெ', 'ே', 'ை', 'ொ', 'ோ', 'ௌ', '்', 'ஃ'],
  // Core consonants – first row
  row2: ['க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம'],
  // Second row of consonants
  row3: ['ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன'],
  // Additional consonants used in loanwords
  row4: ['ஜ', 'ஷ', 'ஸ', 'ஹ'],
  row5: ['ௐ'] as string[],
  row6: [] as string[],
  row7: [] as string[],
  // Hide dedicated number row for Tamil keyboard to avoid extra yellow strip
  numbers: [] as string[],
};

// Hindi (Devanagari) script layout – INSCRIPT-style groupings
const HINDI_LAYOUT = {
  // Independent vowels (अं and अः are multi-codepoint)
  vowels: ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ऋ', 'ए', 'ऐ', 'ओ', 'औ', 'अं', 'अः'],
  // Vowel signs (matras) and virama
  row1: ['ा', 'ि', 'ी', 'ु', 'ू', 'ृ', 'े', 'ै', 'ो', 'ौ', 'ं', 'ः', 'ँ', '्'],
  // Consonants grouped like INSCRIPT rows
  row2: ['क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ'],
  row3: ['ट', 'ठ', 'ड', 'ढ', 'ण', 'त', 'थ', 'द', 'ध', 'न'],
  row4: ['प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व'],
  row5: ['श', 'ष', 'स', 'ह'],
  row6: ['ॐ'] as string[],
  row7: [] as string[],
  numbers: ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'],
};

export function IndicKeyboard({ targetInputId, targetElement, onInput, lang = 'en' }: IndicKeyboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isShift, setIsShift] = useState(false);
  const keyboardRef = useRef<HTMLDivElement>(null);
  const lastFocusedElementRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const isKannada = lang === 'kn';
  const isTamil = lang === 'ta';
  const isHindi = lang === 'hi';
  const isSupported = isKannada || isTamil || isHindi;
  const layout = isKannada ? KANNADA_LAYOUT : isTamil ? TAMIL_LAYOUT : HINDI_LAYOUT;

  // Shared helper to find the target input element
  const findTargetInput = (): HTMLInputElement | HTMLTextAreaElement | null => {
    let element = targetElement;

    // Method 1: Use explicitly provided element
    if (!element && targetInputId) {
      element = document.getElementById(targetInputId) as HTMLInputElement | HTMLTextAreaElement | null;
    }

    // Method 2: Use stored last focused element
    if (!element) {
      element = lastFocusedElementRef.current;
    }

    // Method 3: Find currently focused input/textarea
    if (!element) {
      const focused = document.activeElement;
      if (focused && (focused.tagName === 'TEXTAREA' || focused.tagName === 'INPUT')) {
        element = focused as HTMLInputElement | HTMLTextAreaElement;
        lastFocusedElementRef.current = element;
      }
    }

    // Method 4: Search for the most recently focused input/textarea in the document
    if (!element) {
      const allInputs = document.querySelectorAll(
        'textarea[lang="kn"], input[lang="kn"], [lang="kn"] textarea, [lang="kn"] input,' +
        'textarea[lang="ta"], input[lang="ta"], [lang="ta"] textarea, [lang="ta"] input,' +
        'textarea[lang="hi"], input[lang="hi"], [lang="hi"] textarea, [lang="hi"] input,' +
        'textarea:not([readonly]), input:not([readonly])'
      );

      if (allInputs.length > 0) {
        for (let i = 0; i < allInputs.length; i++) {
          const input = allInputs[i] as HTMLInputElement | HTMLTextAreaElement;
          if (input.offsetParent !== null && !input.disabled && !input.readOnly) {
            element = input;
            lastFocusedElementRef.current = element;
            break;
          }
        }
        if (!element && allInputs.length > 0) {
          element = allInputs[0] as HTMLInputElement | HTMLTextAreaElement;
          lastFocusedElementRef.current = element;
        }
      }
    }
    return element || null;
  };

  // Shared helper to update input value and trigger events
  const triggerInputUpdate = (element: HTMLInputElement | HTMLTextAreaElement, newValue: string, char: string | null) => {
    // Step 1: Set value using native setter
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(element),
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, newValue);
    } else {
      (element as any).value = newValue;
    }

    // Step 2: Create input event
    let inputEvent: InputEvent;
    try {
      inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        composed: true,
        data: char,
        inputType: char === null ? 'deleteContentBackward' : 'insertText'
      } as any);
    } catch (e) {
      inputEvent = document.createEvent('InputEvent') as InputEvent;
      inputEvent.initEvent('input', true, true);
    }

    // Step 3: Trigger React's onChange
    let handlerFound = false;
    try {
      // Find React Fiber node
      const allKeys = Object.keys(element);
      const reactKeys = allKeys.filter(key =>
        key.startsWith('__reactFiber') ||
        key.startsWith('__reactInternalInstance') ||
        key.includes('reactFiber')
      );

      for (const reactKey of reactKeys) {
        try {
          const fiberNode = (element as any)[reactKey];
          if (!fiberNode) continue;

          let currentFiber = fiberNode;
          let depth = 0;
          const maxDepth = 20;

          while (currentFiber && depth < maxDepth) {
            const fiberProps =
              currentFiber.memoizedProps ||
              currentFiber.pendingProps ||
              currentFiber.props ||
              currentFiber.memoizedState?.memoizedProps;

            if (fiberProps && fiberProps.onChange) {
              const eventTarget = {
                value: newValue,
                tagName: element.tagName,
                type: element.type,
                name: element.name,
                id: element.id,
              };
              Object.setPrototypeOf(eventTarget, element);

              const syntheticEvent = {
                target: eventTarget,
                currentTarget: element,
                bubbles: true,
                cancelable: true,
                defaultPrevented: false,
                eventPhase: 2,
                isTrusted: false,
                nativeEvent: inputEvent,
                preventDefault: () => { },
                isDefaultPrevented: () => false,
                stopPropagation: () => { },
                persist: () => { },
                timeStamp: Date.now(),
                type: 'change',
              };

              // Ensure target.value is correct for the event
              Object.defineProperty(eventTarget, 'value', {
                value: newValue,
                writable: true,
                enumerable: true,
                configurable: true,
              });

              fiberProps.onChange(syntheticEvent);
              handlerFound = true;
              break;
            }
            currentFiber = currentFiber.return || currentFiber._debugOwner;
            depth++;
          }
          if (handlerFound) break;
        } catch (e) { }
      }
    } catch (e) { }

    // Fallback: Registered handler
    if (!handlerFound) {
      try {
        updateInputFromKeyboard(element, newValue);
        handlerFound = true;
      } catch (e) { }
    }

    // Fallback: Native events
    if (!handlerFound) {
      element.dispatchEvent(inputEvent);
      element.dispatchEvent(new Event('change', { bubbles: true }));
      if (document.activeElement === element) {
        document.dispatchEvent(inputEvent);
      }
    }
  };


  const insertChar = (char: string) => {
    // navigator.vibrate() is not supported on iOS Safari — intentional.
    // The try/catch handles it gracefully. Do not debug this on iPhone.
    try { navigator.vibrate(10); } catch (e) { /* not supported */ }

    const element = findTargetInput();
    if (!element) {
      logger.warn('⚠️ Keyboard: No input element found');
      return;
    }

    const start = element.selectionStart || 0;
    const end = element.selectionEnd || 0;
    const currentValue = element.value || '';
    const newValue = currentValue.slice(0, start) + char + currentValue.slice(end);

    triggerInputUpdate(element, newValue, char);

    // Update cursor position
    const newPos = start + char.length;
    requestAnimationFrame(() => {
      try {
        element.setSelectionRange(newPos, newPos);
        element.focus();
      } catch (e) { }
    });

    if (onInput) onInput(char);
  };

  const handleBackspace = () => {
    try { navigator.vibrate(10); } catch (e) { /* not supported */ }
    const element = findTargetInput();
    if (element) {
      const start = element.selectionStart || 0;
      const end = element.selectionEnd || 0;
      const value = element.value || '';
      let newValue = value;
      let newPos = start;

      if (start === end && start > 0) {
        // Delete previous character
        // Check for surrogate pairs to delete properly? For now simple slice.
        newValue = value.slice(0, start - 1) + value.slice(start);
        newPos = start - 1;
      } else if (start !== end) {
        // Delete selection
        newValue = value.slice(0, start) + value.slice(end);
        newPos = start;
      }

      triggerInputUpdate(element, newValue, null);

      requestAnimationFrame(() => {
        try {
          element.setSelectionRange(newPos, newPos);
          element.focus();
        } catch (e) { }
      });
    }
  };

  const handleSpace = () => insertChar(' ');
  const handleEnter = () => insertChar('\n');

  // Helper function to handle keyboard button clicks
  // Prevents blur and re-focuses input
  const handleKeyButtonClick = (char: string) => {
    insertChar(char);
    // Re-focus the input after clicking to keep keyboard open
    setTimeout(() => {
      if (lastFocusedElementRef.current) {
        lastFocusedElementRef.current.focus();
      }
    }, 10);
  };

  // Prevent blur when clicking keyboard buttons
  const handleKeyButtonMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent losing focus from input
  };

  const handleKeyButtonTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent losing focus from input
  };

  // Auto-register all inputs/textarea elements for keyboard support
  useEffect(() => {
    const registerInputs = () => {
      // Query all potential inputs
      const allInputs = document.querySelectorAll('textarea, input');

      allInputs.forEach((input) => {
        if (!(input instanceof HTMLInputElement) && !(input instanceof HTMLTextAreaElement)) return;

        // Check if this input should have the custom keyboard
        const hasLangKn = input.getAttribute('lang') === 'kn' || input.closest('[lang="kn"]');
        const hasLangTa = input.getAttribute('lang') === 'ta' || input.closest('[lang="ta"]');
        const hasLangHi = input.getAttribute('lang') === 'hi' || input.closest('[lang="hi"]');
        const shouldHaveCustomKeyboard = hasLangKn || hasLangTa || hasLangHi;

        if (shouldHaveCustomKeyboard) {
          // 1. Set inputMode to 'none' to prevent native keyboard on mobile
          // only if not already set (to avoid fighting with other logic if any)
          if (input.getAttribute('inputMode') !== 'none') {
            input.setAttribute('inputMode', 'none');
            input.setAttribute('data-custom-keyboard-active', 'true');
          }

          // 2. Find and register onChange handler
          const reactKeys = Object.keys(input).filter(key =>
            key.startsWith('__reactFiber') ||
            key.startsWith('__reactInternalInstance')
          );

          for (const reactKey of reactKeys) {
            try {
              const fiberNode = (input as any)[reactKey];
              if (!fiberNode) continue;

              let currentFiber = fiberNode;
              let depth = 0;
              while (currentFiber && depth < 10) {
                const props = currentFiber.memoizedProps || currentFiber.pendingProps || currentFiber.props;
                if (props?.onChange) {
                  // Register this input with its onChange handler
                  const handler = (newValue: string) => {
                    const nativeSetter = Object.getOwnPropertyDescriptor(
                      Object.getPrototypeOf(input),
                      'value'
                    )?.set;
                    if (nativeSetter) {
                      nativeSetter.call(input, newValue);
                    } else {
                      (input as any).value = newValue;
                    }

                    const syntheticEvent = {
                      target: input,
                      currentTarget: input,
                      bubbles: true,
                      cancelable: true,
                      defaultPrevented: false,
                      eventPhase: 0,
                      isTrusted: false,
                      nativeEvent: {} as Event,
                      preventDefault: () => { },
                      isDefaultPrevented: () => false,
                      stopPropagation: () => { },
                      persist: () => { },
                      timeStamp: Date.now(),
                      type: 'input',
                    };
                    // Cast to any then to ChangeEvent to satisfy TypeScript
                    (props.onChange as any)(syntheticEvent as unknown as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>);
                  };

                  registerInputForKeyboard(input, handler);
                  break;
                }
                currentFiber = currentFiber.return || currentFiber._debugOwner;
                depth++;
              }
            } catch (e) {
              // Continue
            }
          }
        } else {
          // Cleanup if it was previously active but now isn't (e.g. lang change)
          if (input.getAttribute('data-custom-keyboard-active') === 'true') {
            input.removeAttribute('inputMode'); // Restore default
            input.removeAttribute('data-custom-keyboard-active');
          }
        }
      });
    };

    // Register inputs initially and on DOM changes
    registerInputs();
    const observer = new MutationObserver(registerInputs);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['lang'] });

    return () => observer.disconnect();
  }, []);

  // Auto-show keyboard when focus on textarea/input with lang=kn or lang=ta
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isTextInput = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT';
      const hasLangKn = target.getAttribute('lang') === 'kn' || target.closest('[lang="kn"]');
      const hasLangTa = target.getAttribute('lang') === 'ta' || target.closest('[lang="ta"]');
      const hasLangHi = target.getAttribute('lang') === 'hi' || target.closest('[lang="hi"]');

      if (isTextInput && (hasLangKn || hasLangTa || hasLangHi)) {
        // Store the focused element for later use
        lastFocusedElementRef.current = target as HTMLInputElement | HTMLTextAreaElement;

        // Auto-open if configured (some users might prefer manual, but here we auto-open)
        setIsOpen(true);
        logger.log('✅ Keyboard: Element focused and keyboard shown:', target.tagName, target.id || target.className);
      }
    };

    const handleBlur = (e: FocusEvent) => {
      // Use a slightly longer timeout and deeper checks to handle mobile/fast interactions
      const timeoutId = setTimeout(() => {
        const activeElement = document.activeElement;
        const relatedTarget = e.relatedTarget as Node;

        // CRITICAL: Check if we are interacting with the keyboard itself
        const isClickInsideKeyboard = keyboardRef.current?.contains(activeElement) ||
          keyboardRef.current?.contains(relatedTarget);

        // Check if the focus just moved from one input to another supported input
        const isTargetTextInput = activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT');
        const targetHasLang = activeElement && (
          activeElement.getAttribute('lang') === 'kn' ||
          activeElement.getAttribute('lang') === 'ta' ||
          activeElement.getAttribute('lang') === 'hi' ||
          activeElement.closest('[lang="kn"]') ||
          activeElement.closest('[lang="ta"]') ||
          activeElement.closest('[lang="hi"]')
        );

        if (isClickInsideKeyboard || (isTargetTextInput && targetHasLang)) {
          logger.log('✅ Keyboard: Keeping open (internal interaction or new supported input)');
          if (isTargetTextInput && targetHasLang) {
            lastFocusedElementRef.current = activeElement as HTMLInputElement | HTMLTextAreaElement;
          }
          return;
        }

        // Final check: if we are still "working" on the keyboard, don't close
        // This is a safety for mobile where focus events can be flaky
        if (!activeElement || activeElement === document.body) {
          // On some mobile browsers, focus might briefly go to body
          return;
        }

        logger.log('🔒 Keyboard: Closing - focus moved to non-supported element:', activeElement.tagName);
        setIsOpen(false);
      }, 200);

      return () => clearTimeout(timeoutId);
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  // Scroll compensation: add bottom padding when keyboard opens so content isn't hidden
  useEffect(() => {
    const scrollContainer = document.querySelector('main') || document.documentElement;
    if (isOpen) {
      scrollContainer.style.paddingBottom = '40vh';
      // Scroll the focused input into view above the keyboard
      if (lastFocusedElementRef.current) {
        lastFocusedElementRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      scrollContainer.style.paddingBottom = '';
    }
    return () => {
      scrollContainer.style.paddingBottom = '';
    };
  }, [isOpen]);

  if (!isSupported) return null;
  if (typeof document === 'undefined') return null;

  const openLabel = lang === 'ta' ? 'விசைப்பலகை' : lang === 'hi' ? 'कीबोर्ड' : 'ಕೀಬೋರ್ಡ್';
  const aria = lang === 'ta' ? 'Show Tamil Keyboard' : lang === 'hi' ? 'Show Hindi Keyboard' : 'Show Kannada Keyboard';

  const content = !isOpen ? (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onMouseDown={(e) => {
        e.preventDefault(); // CRITICAL: Stop the focus from leaving the current input
        setIsOpen(true);
      }}
      onClick={() => setIsOpen(true)}
      className="fixed bottom-4 right-4 z-[100] shadow-lg bg-blue-50 hover:bg-blue-100 border-blue-300 animate-in fade-in slide-in-from-bottom-2 duration-300"
      aria-label={aria}
    >
      <Keyboard className="w-4 h-4 mr-2" />
      {openLabel}
    </Button>
  ) : (
    <div
      ref={keyboardRef}
      className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-300 shadow-2xl p-2 md:p-4"
      style={{ maxHeight: '40vh', overflowY: 'auto' }}
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">
            {isKannada ? 'ಕನ್ನಡ ಕೀಬೋರ್ಡ್' : isTamil ? 'தமிழ் விசைப்பலகை' : 'हिंदी कीबोर्ड'}
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 p-0"
            aria-label="Close Keyboard"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-0.5">
          {/* Vowels */}
          <div className="flex flex-wrap gap-0.5 justify-center">
            {layout.vowels.map((char) => (
              <button
                key={char}
                type="button"
                onMouseDown={handleKeyButtonMouseDown}
                onTouchStart={handleKeyButtonTouchStart}
                onClick={() => handleKeyButtonClick(char)}
                className="min-w-[44px] px-3 py-2 text-lg font-medium bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded active:bg-blue-200 transition-colors touch-manipulation"
              >
                {char}
              </button>
            ))}
          </div>

          {/* Consonants Row 1 */}
          <div className="flex flex-wrap gap-0.5 justify-center">
            {layout.row1.map((char) => (
              <button
                key={char}
                type="button"
                onMouseDown={handleKeyButtonMouseDown}
                onTouchStart={handleKeyButtonTouchStart}
                onClick={() => handleKeyButtonClick(char)}
                className="min-w-[44px] px-3 py-2 text-lg font-medium bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded active:bg-gray-200 transition-colors touch-manipulation"
              >
                {char}
              </button>
            ))}
          </div>

          {/* Consonants Row 2 */}
          <div className="flex flex-wrap gap-0.5 justify-center">
            {layout.row2.map((char) => (
              <button
                key={char}
                type="button"
                onMouseDown={handleKeyButtonMouseDown}
                onTouchStart={handleKeyButtonTouchStart}
                onClick={() => handleKeyButtonClick(char)}
                className="min-w-[44px] px-3 py-2 text-lg font-medium bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded active:bg-gray-200 transition-colors touch-manipulation"
              >
                {char}
              </button>
            ))}
          </div>

          {/* Consonants Row 3 */}
          <div className="flex flex-wrap gap-0.5 justify-center">
            {layout.row3.map((char) => (
              <button
                key={char}
                type="button"
                onMouseDown={handleKeyButtonMouseDown}
                onTouchStart={handleKeyButtonTouchStart}
                onClick={() => handleKeyButtonClick(char)}
                className="min-w-[44px] px-3 py-2 text-lg font-medium bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded active:bg-gray-200 transition-colors touch-manipulation"
              >
                {char}
              </button>
            ))}
          </div>

          {/* Consonants Row 4 */}
          <div className="flex flex-wrap gap-0.5 justify-center">
            {layout.row4.map((char) => (
              <button
                key={char}
                type="button"
                onMouseDown={handleKeyButtonMouseDown}
                onTouchStart={handleKeyButtonTouchStart}
                onClick={() => handleKeyButtonClick(char)}
                className="min-w-[44px] px-3 py-2 text-lg font-medium bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded active:bg-gray-200 transition-colors touch-manipulation"
              >
                {char}
              </button>
            ))}
          </div>

          {/* Consonants Row 5 */}
          <div className="flex flex-wrap gap-0.5 justify-center">
            {layout.row5.map((char) => (
              <button
                key={char}
                type="button"
                onMouseDown={handleKeyButtonMouseDown}
                onTouchStart={handleKeyButtonTouchStart}
                onClick={() => handleKeyButtonClick(char)}
                className="min-w-[44px] px-3 py-2 text-lg font-medium bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded active:bg-gray-200 transition-colors touch-manipulation"
              >
                {char}
              </button>
            ))}
          </div>

          {/* Consonants Row 6 */}
          <div className="flex flex-wrap gap-0.5 justify-center">
            {layout.row6.map((char) => (
              <button
                key={char}
                type="button"
                onMouseDown={handleKeyButtonMouseDown}
                onTouchStart={handleKeyButtonTouchStart}
                onClick={() => handleKeyButtonClick(char)}
                className="min-w-[44px] px-3 py-2 text-lg font-medium bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded active:bg-gray-200 transition-colors touch-manipulation"
              >
                {char}
              </button>
            ))}
          </div>

          {/* Consonants Row 7 */}
          <div className="flex flex-wrap gap-0.5 justify-center">
            {layout.row7.map((char) => (
              <button
                key={char}
                type="button"
                onMouseDown={handleKeyButtonMouseDown}
                onTouchStart={handleKeyButtonTouchStart}
                onClick={() => handleKeyButtonClick(char)}
                className="min-w-[44px] px-3 py-2 text-lg font-medium bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded active:bg-gray-200 transition-colors touch-manipulation"
              >
                {char}
              </button>
            ))}
          </div>

          {/* Numbers and Actions */}
          <div className="flex flex-wrap gap-0.5 justify-center items-center mt-1">
            <div className="flex flex-wrap gap-0.5">
              {layout.numbers.map((char) => (
                <button
                  key={char}
                  type="button"
                  onMouseDown={handleKeyButtonMouseDown}
                  onTouchStart={handleKeyButtonTouchStart}
                  onClick={() => handleKeyButtonClick(char)}
                  className="min-w-[44px] px-3 py-2 text-lg font-medium bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded active:bg-yellow-200 transition-colors touch-manipulation"
                >
                  {char}
                </button>
              ))}
            </div>
            <button
              type="button"
              onMouseDown={handleKeyButtonMouseDown}
              onTouchStart={handleKeyButtonTouchStart}
              onClick={() => handleKeyButtonClick(' ')}
              className="min-w-[44px] px-6 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded active:bg-gray-300 transition-colors touch-manipulation"
            >
              Space
            </button>
            <button
              type="button"
              onMouseDown={handleKeyButtonMouseDown}
              onTouchStart={handleKeyButtonTouchStart}
              onClick={() => {
                handleBackspace();
                setTimeout(() => {
                  if (lastFocusedElementRef.current) {
                    lastFocusedElementRef.current.focus();
                  }
                }, 10);
              }}
              className="min-w-[44px] px-4 py-2 text-sm font-medium bg-red-50 hover:bg-red-100 border border-red-200 rounded active:bg-red-200 transition-colors touch-manipulation"
            >
              ⌫
            </button>
            {targetElement?.tagName === 'TEXTAREA' && (
              <button
                type="button"
                onMouseDown={handleKeyButtonMouseDown}
                onTouchStart={handleKeyButtonTouchStart}
                onClick={() => handleKeyButtonClick('\n')}
                className="min-w-[44px] px-4 py-2 text-sm font-medium bg-green-50 hover:bg-green-100 border border-green-200 rounded active:bg-green-200 transition-colors touch-manipulation"
              >
                ↵ Enter
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

