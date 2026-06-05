package com.calc.control;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import com.calc.bean.dto.CalcRequest;
import com.calc.bean.dto.CalcResponse;
import com.calc.service.CalcService;

//@RestController
@Controller
public class CalcController {

    private final CalcService service;

    public CalcController(CalcService service) {
        this.service = service;
    }

    @PostMapping("/calc")
    // JSON を返したいメソッドだけ @ResponseBody を付ける。
    @ResponseBody
    public CalcResponse calc(@RequestBody CalcRequest req) {
        try {
            double result = service.calculate(req);
            return CalcResponse.success(result);
        } catch (Exception e) {
            return CalcResponse.failure(e.getMessage());
        }    }

    @GetMapping("/")
    public String index() {
        return "top"; // top.html を返す
    }
}
