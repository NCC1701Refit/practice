package com.calc.service;

import org.springframework.stereotype.Service;

import com.calc.bean.dto.CalcRequest;

@Service
public class CalcService {

    private static final double MAX = 1e100; // 100桁くらいまで許容

    private void checkOverflow(double v) {
        if (Math.abs(v) > MAX) {
            throw new IllegalArgumentException("Overflow");
        }
    }

    public double calculate(CalcRequest req) {
        checkOverflow(req.left);
        checkOverflow(req.right);

        double result;

        switch (req.operator) {
            case "+" -> result = req.left + req.right;
            case "-" -> result = req.left - req.right;
            case "*" -> result = req.left * req.right;
            case "/" -> {
                if (req.right == 0) throw new IllegalArgumentException("Division by zero");
                result = req.left / req.right;
            }
            default -> throw new IllegalArgumentException("Invalid operator");
        }

        checkOverflow(result);
        return result;
    }
}
