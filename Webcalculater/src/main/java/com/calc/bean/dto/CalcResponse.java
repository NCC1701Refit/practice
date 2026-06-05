package com.calc.bean.dto;

public class CalcResponse {
    public Double result;   // 成功時だけ入る
    public String error;    // エラー時だけ入る

    public CalcResponse(Double result, String error) {
        this.result = result;
        this.error = error;
    }

    public static CalcResponse success(double result) {
        return new CalcResponse(result, null);
    }

    public static CalcResponse failure(String error) {
        return new CalcResponse(null, error);
    }
}
