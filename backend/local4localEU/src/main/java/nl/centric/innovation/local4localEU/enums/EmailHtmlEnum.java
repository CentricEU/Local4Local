package nl.centric.innovation.local4localEU.enums;

import lombok.Getter;

public enum EmailHtmlEnum {
    P_START("<p style=\"margin: 0;\">"),
    P_END("</p>"),
    BOLD_START("<b>"),
    BOLD_END("</b>"),
    LINE_BREAK("<br>"),
    RN("\r\n"),
    H2_START("<h2 style=\" text-align: center;\">"),
    H2_END("</h2>"),
    UL_START("<ul>"),
    UL_END("</ul>"),
    LI_START("<li>"),
    LI_END("</li>"),
    EXCL("!"),
    LINK_START("<a href=\"%s\">"),
    LINK_END("</a>"),
    END(".");

    private final String html;

    EmailHtmlEnum(String html) {
        this.html = html;
    }

    public String getTag() {
        return html;
    }

    public static String getLinkTag(String url, String text) {
        return String.format(LINK_START.getTag(), url) + text + LINK_END.getTag();
    }
}
