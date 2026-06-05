const display = document.getElementById("display");
// ===============================
// 電卓の内部状態
// ===============================

let currentValue = "0";   // 現在入力中の値（画面に表示される値）
let storedValue = null;   // 前回の計算結果（左オペランドとして使う）
let currentOp = null;     // 現在選択されている演算子（+, -, *, /）
let shouldClearOnNextDigit = false;	// 演算子押下・計算後に、次の数字入力で currentValue をリセットするためのフラグ
let lastRightOperand = null;   // ＝連続押し用の右オペランド
let lastOperator = null;       // ＝連続押し用の演算子
let lastWasEqual = false;   // ★ 直前が＝かどうか

function formatNumberForDisplay(value) {
	// 数値でなければ（エラーメッセージなど）そのまま返す
	if (isNaN(Number(value))) {
	    return String(value);
	}

	const str = String(value);

    // 13桁以上なら指数表記にする
    if (str.replace("-", "").replace(".", "").length > 12) {
        return Number(value).toExponential(); // デフォルト指数表記
    }

    return str;
}

function updateDisplay() {
	// 表示すべき値を決める
	let valueToShow="";
    if (currentValue !== "0") {
         valueToShow = currentValue;
    } else {
		// storedValue が null または undefined → "0" を使う
		// storedValue に値がある → その値を使う
         valueToShow = storedValue ?? "0";
    }
	display.textContent = formatNumberForDisplay(valueToShow);
}

// ===============================
// 数字ボタン押下
// ===============================
function onDigit(d) {
	lastWasEqual = false; // ★ 直前が＝かどうかを元に戻す
	// ===============================
	// ★ 追加：必要ならここで計算する ★
	// ===============================
	// 条件：
	// ・演算子がセットされている（currentOp !== null）
	// ・前回の入力が演算子押下直後（shouldClearOnNextDigit === true）
	// ・storedValue が存在する（左オペランドがある）
	//
	// → この3つが揃った「次の数字入力時」に計算を実行する
//	if (currentOp !== null && shouldClearOnNextDigit && storedValue !== null) {
//	    // 直前に演算子を押していて、今が「右オペランドの入力開始」
//	    // → このタイミングで計算を実行する
//	    doCalc(currentOp);
//	}
	// ===============================
	// 計算直後・演算子押下直後は表示をクリアして新しい数字を入れる
	// ===============================
	if (shouldClearOnNextDigit) {
	    currentValue = d;
	    shouldClearOnNextDigit = false;
	    updateDisplay();
	    return;
	}
		
	// 通常の数字入力（末尾に追加）
    if (currentValue === "0") {
        currentValue = d;
    } else if (currentValue === "-0") {
        currentValue = "-" + d;
    } else {
        currentValue += d;
    }
    updateDisplay();
}

function onDot() {
	lastWasEqual = false; // ★ 直前が＝かどうかを元に戻す
    if (!currentValue.includes(".")) {
        currentValue += ".";
        updateDisplay();
    }
}

function onSignToggle() {
	lastWasEqual = false; // ★ 直前が＝かどうかを元に戻す
    if (currentValue.startsWith("-")) {
        currentValue = currentValue.slice(1);
    } else if (currentValue !== "0") {
        currentValue = "-" + currentValue;
    }
    updateDisplay();
}

function onClear() {
	currentValue = "0";
	storedValue = null;
	currentOp = null;
	lastRightOperand = null;
	lastOperator = null;
	lastWasEqual = false;   // ★ 直前が＝かどうかを元に戻す	
    updateDisplay();
}

function isOverflow(v) {
	// return Math.abs(v) > 1_000_000_000_000;
    return Math.abs(v) > 1e100;
}


// ===============================
// 計算処理
// ===============================
async function doCalc(op) {

    const body = {
        left: parseFloat(storedValue),
        operator: op,
        right: parseFloat(currentValue)
    };

    const res = await fetch(contextPath + "calc", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
    });

    const data = await res.json();

    // サーバー側エラー（ゼロ除算など）
    if (data.error) {
        currentValue = data.error;
        storedValue = null;
        currentOp = null;
        shouldClearOnNextDigit = true;
        updateDisplay();
        return;
    }

    // 計算成功 → 結果を反映
    storedValue = String(data.result);
    currentValue = storedValue;
    updateDisplay();
}

// ===============================
// 演算子ボタン押下（+, -, *, /）
// ===============================
async function onOperator(op) {
	
	lastWasEqual = false; // ★ 直前が＝かどうかを元に戻す
	// 直前がエラーなら何もできない
	if (isNaN(Number(currentValue))) {
	    return;
	}

	// ① 初回の演算子押下（まだ storedValue が無い）
	if (storedValue === null) {
	    storedValue = currentValue;
	    currentOp = op;
	    shouldClearOnNextDigit = true; // 次の数字入力でクリア
//	    updateDisplay();
	    return;
	
	}		
	// ② ＝の後に演算子を押した場合（currentOp が null）
	// → 左オペランドとして currentValue を保存するだけ
	if (currentOp === null) {
	    currentOp = op;
	    storedValue = currentValue;   // ＝後の値を左オペランドにする
	    shouldClearOnNextDigit = true;
	    return;
	}
	// ③ すでに演算子がある → その演算子で計算してから次の演算子へ
	// → ここでは計算しない！
	// → 計算は「次の数字入力時」に onDigit が行う	doCalc(currentOp);
	currentOp = op;
	shouldClearOnNextDigit = true;
	// 直前に演算子を押しただけ（数字が入力されていない）
	// → 計算せず operator だけ更新
	//if (shouldClearOnNextDigit) {
	//    currentOp = op;
	//    return;
	//}

}

// ===============================
// ＝ボタン押下
// ===============================
async function onEqual() {

	// ===============================
	// ★ 連続＝（直前が＝だった場合のみ発動）
	// ===============================
	if (lastWasEqual) {

	    // lastOperator / lastRightOperand が無ければ何もしない
	    if (lastOperator === null || lastRightOperand === null) {
	        return;
	    }

	    // 連続計算
	    const body = {
	        left: parseFloat(currentValue),
	        operator: lastOperator,
	        right: parseFloat(lastRightOperand)
	    };

	    const res = await fetch(contextPath + "calc", {
	        method: "POST",
	        headers: {"Content-Type": "application/json"},
	        body: JSON.stringify(body)
	    });

	    const data = await res.json();

	    currentValue = String(data.result);
	    storedValue = currentValue;
	    updateDisplay();
	    shouldClearOnNextDigit = true;

	    return;
	}
	// ===============================
	// ★ 初回の＝押下
	// ===============================

	// 演算子が無いなら何もしない
	if (currentOp === null) return;

	// 今の右オペランドを記憶（連続＝用）
	lastRightOperand = currentValue;

	// 今の演算子も記憶
	lastOperator = currentOp;

	// 通常の計算
	await doCalc(currentOp);

	// ＝後は演算子をクリア
	currentOp = null;

	// 次の数字入力でクリア
	shouldClearOnNextDigit = true;

	// ★ 直前が＝であることを記録
	lastWasEqual = true;

}

// ===============================
// ←（バックスペース）
// ===============================
// ・1文字だけ削除する
// ・1桁しかない場合は "0" に戻す
// ・計算直後（＝押した直後）や演算子押下直後は、
//   「入力開始状態」なので 0 に戻すだけにする
// ===============================
function onBackspace() {

	lastWasEqual = false; // ★ 直前が＝かどうかを元に戻す
    // 計算直後 or 演算子押下直後は、まだ新しい数字を入力していない状態
    // この状態で ← を押すと、電卓としては「0 に戻す」が自然
    if (shouldClearOnNextDigit) {
        currentValue = "0";
        shouldClearOnNextDigit = false;  // 次の入力は通常扱いに戻す
        updateDisplay();
        return;
    }

    // 通常の数字入力中：末尾1文字を削除
    if (currentValue.length > 1) {
        currentValue = currentValue.slice(0, -1);  // 末尾1文字削除
    } else {
        // 1桁しかない場合は "0" に戻す
        currentValue = "0";
    }

    updateDisplay();
}
